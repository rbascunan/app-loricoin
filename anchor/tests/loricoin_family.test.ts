// Solana Playground test file: `pg`, `web3`, `BN` and `assert` are globals there.
// Run it with the "Test" button after deploying the program to devnet.

const u16 = (n: number) => new BN(n).toArrayLike(Buffer, "le", 2)
const u32 = (n: number) => new BN(n).toArrayLike(Buffer, "le", 4)
const CONFIRMED = { commitment: "confirmed" as const }

const findPda = (seeds: Buffer[]) =>
  web3.PublicKey.findProgramAddressSync(seeds, pg.program.programId)[0]

// Devnet RPC nodes can lag a few seconds behind a confirmed transaction.
async function fetchConfirmed(kind: "family" | "child" | "task", address: web3.PublicKey) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const data = await (pg.program.account as any)[kind].fetchNullable(address, "confirmed")
    if (data) return data
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }
  throw new Error(`La cuenta ${kind} ${address.toBase58()} no apareció en devnet`)
}

async function expectError(promise: Promise<unknown>, codes: string[]) {
  let succeeded = false
  try {
    await promise
    succeeded = true
  } catch (err: any) {
    const message = String(err?.error?.errorCode?.code ?? err?.message ?? err)
    const matched = codes.find((code) => message.includes(code))
    assert.ok(matched, `Error inesperado: ${message}`)
    console.log(`  rechazado correctamente con ${matched}`)
  }
  assert.ok(!succeeded, `Se esperaba uno de estos errores: ${codes.join(", ")}`)
}

describe("loricoin_family", () => {
  const parent = pg.wallet.publicKey
  const family = findPda([Buffer.from("family"), parent.toBuffer()])
  let child: web3.PublicKey
  let task: web3.PublicKey

  it("1. crea la familia (o reutiliza la existente)", async () => {
    const existing = await pg.program.account.family.fetchNullable(family, "confirmed")
    if (!existing) {
      const tx = await pg.program.methods
        .createFamily("Familia Bascuñan")
        .accounts({ family, parent, systemProgram: web3.SystemProgram.programId })
        .rpc(CONFIRMED)
      console.log("  createFamily tx:", tx)
    }
    const data = await fetchConfirmed("family", family)
    assert.ok(data.parent.equals(parent))
  })

  it("2. agrega un hijo con PDA derivada de la familia", async () => {
    const data = await fetchConfirmed("family", family)
    child = findPda([Buffer.from("child"), family.toBuffer(), u16(data.nextChildId)])
    const tx = await pg.program.methods
      .addChild("Betito")
      .accounts({ family, child, parent, systemProgram: web3.SystemProgram.programId })
      .rpc(CONFIRMED)
    console.log("  addChild tx:", tx)
    const childData = await fetchConfirmed("child", child)
    assert.ok(childData.family.equals(family))
  })

  it("3. crea una tarea pendiente", async () => {
    const childData = await fetchConfirmed("child", child)
    task = findPda([Buffer.from("task"), child.toBuffer(), u32(childData.nextTaskId)])
    const tx = await pg.program.methods
      .createTask("Ordenar la habitación", new BN(10))
      .accounts({ family, child, task, parent, systemProgram: web3.SystemProgram.programId })
      .rpc(CONFIRMED)
    console.log("  createTask tx:", tx)
    await fetchConfirmed("task", task)
    assert.equal((await fetchConfirmed("child", child)).pendingTasks, 1)
  })

  it("4. rechaza una recompensa inválida", async () => {
    await expectError(
      pg.program.methods.updateTaskReward(new BN(0)).accounts({ family, child, task, parent }).rpc(CONFIRMED),
      ["InvalidReward"],
    )
  })

  it("5. actualiza la recompensa de una tarea pendiente", async () => {
    const tx = await pg.program.methods
      .updateTaskReward(new BN(15))
      .accounts({ family, child, task, parent })
      .rpc(CONFIRMED)
    console.log("  updateTaskReward tx:", tx)
    assert.equal((await fetchConfirmed("task", task)).reward.toNumber(), 15)
  })

  it("6. rechaza cerrar un hijo con tareas pendientes", async () => {
    await expectError(
      pg.program.methods.closeChild().accounts({ family, child, parent }).rpc(CONFIRMED),
      ["ChildHasPendingTasks"],
    )
  })

  it("7. rechaza que otra wallet apruebe la tarea", async () => {
    const intruder = web3.Keypair.generate()
    await expectError(
      pg.program.methods
        .approveTask()
        .accounts({ family, child, task, parent: intruder.publicKey })
        .signers([intruder])
        .rpc(CONFIRMED),
      ["Unauthorized", "ConstraintSeeds"],
    )
  })

  it("8. aprueba la tarea y suma el saldo", async () => {
    const tx = await pg.program.methods
      .approveTask()
      .accounts({ family, child, task, parent })
      .rpc(CONFIRMED)
    console.log("  approveTask tx:", tx)
    const childData = await fetchConfirmed("child", child)
    assert.equal(childData.balance.toNumber(), 15)
    assert.equal(childData.pendingTasks, 0)
  })

  it("9. rechaza aprobar dos veces la misma tarea", async () => {
    await expectError(
      pg.program.methods.approveTask().accounts({ family, child, task, parent }).rpc(CONFIRMED),
      ["TaskNotPending"],
    )
  })

  it("10. cierra el hijo sin tareas pendientes y devuelve la renta", async () => {
    const tx = await pg.program.methods
      .closeChild()
      .accounts({ family, child, parent })
      .rpc(CONFIRMED)
    console.log("  closeChild tx:", tx)
    assert.equal(await pg.program.account.child.fetchNullable(child, "confirmed"), null)
  })
})
