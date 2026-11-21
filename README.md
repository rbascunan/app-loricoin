# LoriCoin

**Chores become rewards. Rewards become real digital ownership.**

LoriCoin is a family app where parents assign tasks, kids complete them, and approved tasks earn **LoriCoins**, an SPL token on Solana. It teaches children responsibility, saving and the basics of digital money, with a parent always in control.

Built for the Colosseum hackathon by a father-and-son team from Mendoza, Argentina. Neither of us had built anything on web3 before this hackathon.

## Trabajo final: programa Anchor `loricoin_family`

**Ruta:** proyecto propio (equivalente a Registro / Cliente / Venta del ejemplo: Familia / Hijo / Tarea).

| | |
|---|---|
| Program ID (devnet) | [`tzNXR8sb1amWnYCCA9dmUTVXfLMbcF6nStdxmAsnWWz`](https://explorer.solana.com/address/tzNXR8sb1amWnYCCA9dmUTVXfLMbcF6nStdxmAsnWWz?cluster=devnet) |
| Código del programa | [`anchor/programs/loricoin_family/src/lib.rs`](anchor/programs/loricoin_family/src/lib.rs) |
| Tests | [`anchor/tests/loricoin_family.test.ts`](anchor/tests/loricoin_family.test.ts) |
| IDL | [`anchor/idl/loricoin_family.json`](anchor/idl/loricoin_family.json) |
| Frontend con wallet | [`/programa`](https://v0-apploricoin.vercel.app/programa) (Phantom en devnet) |

### Cuentas y PDAs

| Cuenta | Seeds | Relación |
|---|---|---|
| `Family` | `["family", parent]` | `parent` es la autoridad |
| `Child` | `["child", family, child_id u16]` | `has_one = family` |
| `Task` | `["task", child, task_id u32]` | `has_one = child` |

### Instrucciones y reglas

- `create_family(name)`: crea la familia, el firmante queda como autoridad.
- `add_child(name)`: solo la autoridad (`Unauthorized`).
- `create_task(title, reward)`: recompensa entre 1 y 1000 (`InvalidReward`).
- `update_task_reward(reward)`: solo tareas pendientes (`TaskNotPending`).
- `approve_task()`: suma la recompensa al saldo del hijo; no se puede aprobar dos veces.
- `close_child()`: cierra la cuenta y devuelve la renta, solo si no tiene tareas pendientes (`ChildHasPendingTasks`).

### Cómo desplegar y probar (Solana Playground)

1. Abrir [beta.solpg.io](https://beta.solpg.io), crear un proyecto Anchor y pegar `lib.rs`.
2. Conectar la wallet de Playground en **devnet** y pedir SOL (`solana airdrop 2`).
3. **Build** y **Deploy**. Copiar el Program ID que queda en `declare_id!`.
4. Pegar `loricoin_family.test.ts` en la carpeta de tests y presionar **Test**.
5. IDL exportado desde Solana Playground y versionado en `anchor/idl/loricoin_family.json` (6 instrucciones: `createFamily`, `addChild`, `createTask`, `updateTaskReward`, `approveTask`, `closeChild`; cuentas `Family`, `Child`, `Task`).
6. Configurar `NEXT_PUBLIC_LORICOIN_PROGRAM_ID` en Vercel y redeployar.

### Evidencia

| # | Caso | Resultado | Transacción o error |
|---|---|---|---|
| 1 | Crear familia | Válido | TX_1 |
| 2 | Agregar hijo (PDA) | Válido | TX_2 |
| 3 | Crear tarea | Válido | TX_3 |
| 4 | Recompensa 0 | Rechazado | `InvalidReward` |
| 5 | Editar recompensa | Válido | TX_5 |
| 6 | Cerrar hijo con pendientes | Rechazado | `ChildHasPendingTasks` |
| 7 | Otra wallet aprueba | Rechazado | `Unauthorized` |
| 8 | Aprobar tarea | Válido | TX_8 |
| 9 | Aprobar dos veces | Rechazado | `TaskNotPending` |
| 10 | Cerrar hijo sin pendientes | Válido | TX_10 |

Las transacciones válidas se pueden ver en el [historial del programa en Explorer (devnet)](https://explorer.solana.com/address/tzNXR8sb1amWnYCCA9dmUTVXfLMbcF6nStdxmAsnWWz?cluster=devnet). Los rechazos devuelven el código de error de Anchor indicado.

### Aporte propio

Además del CRUD, el programa modela una economía familiar: el saldo del hijo solo crece al aprobar tareas firmadas por el padre, y la app ya acuña el token SPL LoriCoin en devnet cuando se aprueba una tarea.

## How it works

1. **Parent creates a task** (e.g. "Tidy your room") with a LoriCoin reward.
2. **Child marks it as done** from their own view.
3. **Parent reviews and approves it.**
4. **Child receives LoriCoins**, minted on Solana Devnet to their wallet.

## What we built

- **Web2 app:** accounts, roles (parent / child), task creation, completion and approval flow.
- **Solana layer:** the same flow mirrored on-chain. Approving a task mints LoriCoins (SPL token, 0 decimals) to the child's wallet.
- **Landing page** explaining the product.

### On-chain details

| | |
|---|---|
| Network | Solana **Devnet** |
| Token | LoriCoin (SPL, 0 decimals) |
| Mint address | `BKpo4BuLje94dJSWcBmas39J4sVm7kbCrvByqhgCp8Ap` |

You can inspect the token on Solana Explorer (select cluster: Devnet).

## Tech stack

- Next.js (generated and iterated with v0)
- Supabase (auth and database)
- Vercel (hosting)
- Solana web3.js and SPL Token (Devnet)

## Live links

- App: https://v0-apploricoin.vercel.app
- Landing: https://web-loricoin.vercel.app

## Test access for judges

Create a parent account at https://v0-apploricoin.vercel.app, add a child from the parent view and log in as the child from the "Hijo o hija" tab. To try the Anchor program directly, open `/programa` with Phantom on Devnet.

## Run it locally

```bash
git clone https://github.com/rbascunan/app-loricoin.git
cd app-loricoin
pnpm install
# create .env.local with the variables below
pnpm dev
```

Environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-side only
SOLANA_RPC_URL=https://api.devnet.solana.com
LORICOIN_MINT_ADDRESS=BKpo4BuLje94dJSWcBmas39J4sVm7kbCrvByqhgCp8Ap
SOLANA_MINT_AUTHORITY_KEY=          # server-side only, never committed
WALLET_ENCRYPTION_KEY=              # server-side only, encrypts kids' wallet keys
NEXT_PUBLIC_LORICOIN_PROGRAM_ID=tzNXR8sb1amWnYCCA9dmUTVXfLMbcF6nStdxmAsnWWz
```

## Scope of this hackathon

Included: the task, approval and reward flow, on both web2 and Solana Devnet.

Not included (future work): rewards store where kids spend LoriCoins, NFC ring for physical interaction, mainnet deployment.

## Why us

We are a parent and a 5th grader who already build apps and robotics projects together. LoriCoin is the product we wished existed for our own family, and we learned Solana from scratch to build it.

## Team

- Roberto Bacuñan: product, development
- Roberto Fernando Bacuñan Garello: co-creator, first user and tester
