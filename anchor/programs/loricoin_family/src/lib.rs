use anchor_lang::prelude::*;

// Solana Playground replaces this with the real Program ID on the first build.
declare_id!("11111111111111111111111111111111");

pub const MAX_NAME_LEN: usize = 32;
pub const MAX_TITLE_LEN: usize = 48;
pub const MAX_REWARD: u64 = 1_000;

pub const TASK_PENDING: u8 = 0;
pub const TASK_APPROVED: u8 = 1;

#[program]
pub mod loricoin_family {
    use super::*;

    pub fn create_family(ctx: Context<CreateFamily>, name: String) -> Result<()> {
        validate_text(&name, MAX_NAME_LEN)?;
        let family = &mut ctx.accounts.family;
        family.parent = ctx.accounts.parent.key();
        family.name = name;
        family.next_child_id = 0;
        family.bump = ctx.bumps.family;
        Ok(())
    }

    pub fn add_child(ctx: Context<AddChild>, name: String) -> Result<()> {
        validate_text(&name, MAX_NAME_LEN)?;
        let family = &mut ctx.accounts.family;
        let child = &mut ctx.accounts.child;
        child.family = family.key();
        child.id = family.next_child_id;
        child.name = name;
        child.balance = 0;
        child.pending_tasks = 0;
        child.next_task_id = 0;
        child.bump = ctx.bumps.child;
        family.next_child_id = family
            .next_child_id
            .checked_add(1)
            .ok_or(LoriError::Overflow)?;
        Ok(())
    }

    pub fn create_task(ctx: Context<CreateTask>, title: String, reward: u64) -> Result<()> {
        validate_text(&title, MAX_TITLE_LEN)?;
        validate_reward(reward)?;
        let child = &mut ctx.accounts.child;
        let task = &mut ctx.accounts.task;
        task.child = child.key();
        task.id = child.next_task_id;
        task.title = title;
        task.reward = reward;
        task.status = TASK_PENDING;
        task.bump = ctx.bumps.task;
        child.next_task_id = child.next_task_id.checked_add(1).ok_or(LoriError::Overflow)?;
        child.pending_tasks = child.pending_tasks.checked_add(1).ok_or(LoriError::Overflow)?;
        Ok(())
    }

    pub fn update_task_reward(ctx: Context<UpdateTask>, reward: u64) -> Result<()> {
        validate_reward(reward)?;
        let task = &mut ctx.accounts.task;
        require!(task.status == TASK_PENDING, LoriError::TaskNotPending);
        task.reward = reward;
        Ok(())
    }

    pub fn approve_task(ctx: Context<UpdateTask>) -> Result<()> {
        let task = &mut ctx.accounts.task;
        require!(task.status == TASK_PENDING, LoriError::TaskNotPending);
        task.status = TASK_APPROVED;
        let child = &mut ctx.accounts.child;
        child.balance = child.balance.checked_add(task.reward).ok_or(LoriError::Overflow)?;
        child.pending_tasks = child.pending_tasks.checked_sub(1).ok_or(LoriError::Overflow)?;
        Ok(())
    }

    pub fn close_child(ctx: Context<CloseChild>) -> Result<()> {
        require!(ctx.accounts.child.pending_tasks == 0, LoriError::ChildHasPendingTasks);
        Ok(())
    }
}

fn validate_text(value: &str, max_len: usize) -> Result<()> {
    require!(!value.trim().is_empty(), LoriError::NameEmpty);
    require!(value.len() <= max_len, LoriError::NameTooLong);
    Ok(())
}

fn validate_reward(reward: u64) -> Result<()> {
    require!(reward > 0 && reward <= MAX_REWARD, LoriError::InvalidReward);
    Ok(())
}

#[derive(Accounts)]
pub struct CreateFamily<'info> {
    #[account(
        init,
        payer = parent,
        space = 8 + Family::INIT_SPACE,
        seeds = [b"family", parent.key().as_ref()],
        bump
    )]
    pub family: Account<'info, Family>,
    #[account(mut)]
    pub parent: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddChild<'info> {
    #[account(mut, has_one = parent @ LoriError::Unauthorized)]
    pub family: Account<'info, Family>,
    #[account(
        init,
        payer = parent,
        space = 8 + Child::INIT_SPACE,
        seeds = [b"child", family.key().as_ref(), &family.next_child_id.to_le_bytes()],
        bump
    )]
    pub child: Account<'info, Child>,
    #[account(mut)]
    pub parent: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateTask<'info> {
    #[account(has_one = parent @ LoriError::Unauthorized)]
    pub family: Account<'info, Family>,
    #[account(mut, has_one = family @ LoriError::ChildNotInFamily)]
    pub child: Account<'info, Child>,
    #[account(
        init,
        payer = parent,
        space = 8 + Task::INIT_SPACE,
        seeds = [b"task", child.key().as_ref(), &child.next_task_id.to_le_bytes()],
        bump
    )]
    pub task: Account<'info, Task>,
    #[account(mut)]
    pub parent: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateTask<'info> {
    #[account(has_one = parent @ LoriError::Unauthorized)]
    pub family: Account<'info, Family>,
    #[account(mut, has_one = family @ LoriError::ChildNotInFamily)]
    pub child: Account<'info, Child>,
    #[account(mut, has_one = child @ LoriError::TaskNotForChild)]
    pub task: Account<'info, Task>,
    pub parent: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseChild<'info> {
    #[account(has_one = parent @ LoriError::Unauthorized)]
    pub family: Account<'info, Family>,
    #[account(mut, close = parent, has_one = family @ LoriError::ChildNotInFamily)]
    pub child: Account<'info, Child>,
    #[account(mut)]
    pub parent: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Family {
    pub parent: Pubkey,
    #[max_len(32)]
    pub name: String,
    pub next_child_id: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Child {
    pub family: Pubkey,
    pub id: u16,
    #[max_len(32)]
    pub name: String,
    pub balance: u64,
    pub pending_tasks: u16,
    pub next_task_id: u32,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Task {
    pub child: Pubkey,
    pub id: u32,
    #[max_len(48)]
    pub title: String,
    pub reward: u64,
    pub status: u8,
    pub bump: u8,
}

#[error_code]
pub enum LoriError {
    #[msg("Solo el padre o madre dueño de la familia puede hacer esta operación")]
    Unauthorized,
    #[msg("El texto no puede estar vacío")]
    NameEmpty,
    #[msg("El texto es demasiado largo")]
    NameTooLong,
    #[msg("La recompensa debe estar entre 1 y 1000 LoriCoins")]
    InvalidReward,
    #[msg("La tarea ya fue aprobada")]
    TaskNotPending,
    #[msg("El hijo o hija tiene tareas pendientes y no se puede cerrar")]
    ChildHasPendingTasks,
    #[msg("La cuenta del hijo o hija no pertenece a esta familia")]
    ChildNotInFamily,
    #[msg("La tarea no pertenece a este hijo o hija")]
    TaskNotForChild,
    #[msg("Desbordamiento numérico")]
    Overflow,
}
