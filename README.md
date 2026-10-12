# LoriCoin

**Chores become rewards. Rewards become real digital ownership.**

LoriCoin is a family app where parents assign tasks, kids complete them, and approved tasks earn **LoriCoins**, an SPL token on Solana. It teaches children responsibility, saving and the basics of digital money, with a parent always in control.

Built for the Colosseum hackathon by a father-and-son team from Mendoza, Argentina. Neither of us had built anything on web3 before this hackathon.

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

Use these demo accounts to try the full flow:

- Parent: `PARENT_EMAIL` / `PARENT_PASSWORD`
- Child: `CHILD_EMAIL` / `CHILD_PASSWORD`

## Run it locally

```bash
git clone https://github.com/rbascunan/loricoin.git
cd loricoin
npm install
cp .env.example .env.local   # fill in the variables below
npm run dev
```

Environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SOLANA_RPC_URL=https://api.devnet.solana.com
LORICOIN_MINT_ADDRESS=BKpo4BuLje94dJSWcBmas39J4sVm7kbCrvByqhgCp8Ap
MINT_AUTHORITY_SECRET_KEY=   # server-side only, never committed
```

## Scope of this hackathon

Included: the task, approval and reward flow, on both web2 and Solana Devnet.

Not included (future work): rewards store where kids spend LoriCoins, NFC ring for physical interaction, mainnet deployment.

## Why us

We are a parent and a 5th grader who already build apps and robotics projects together. LoriCoin is the product we wished existed for our own family, and we learned Solana from scratch to build it.

## Team

- Roberto Bacuñan: product, development
- Roberto Fernando Bacuñan Garello: co-creator, first user and tester
