// Solana Playground test file: `pg`, `web3`, `BN` and `assert` are globals there.
// Run it with the "Test" button after deploying the program to devnet.

const u16 = (n: number) => new BN(n).toArrayLike(Buffer, "le", 2)
const u32 = (n: number) => new BN(n).toArrayLike(Buffer, "le", 4)

const findPda = (seeds: Buffer[]) =>
  web3.PublicKey.findProgramAddressSync(seeds, pg.program.programId)[0]

async function expectError(promise: Promise<unknown>, code: string) {
  try {
    await promise
    assert.fail(`Se esperaba el error ${code}`)
  } catch (err: any) {
    const message = String(err?.error?.errorCode?.code ?? err?.message ?? err)
    assert.ok(message.includes(code), `Error inesperado: ${message}`)
    console.log(`  rechazado correctamente con ${code}`)
  }
}

describe("loricoin_family", () => {
  const parent = pg.wallet.publicKey
  const family = findPda([Buffer.from("family"), parent.toBuffer()])
  let child: web3.PublicKey
  let task: web3.PublicKey

  it("1. crea la familia (o reutiliza la existente)", async () => {
    const existing = await pg.program.account.family.fetchNullable(family)
    if (!existing) {
      const tx = await pg.program.methods
        .createFamily("Familia Bascuñan")
        .accounts({ family, parent, systemProgram: web3.SystemProgram.programId })
        .rpc()
      console.log("  createFamily tx:", tx)
    }
    const data = await pg.program.account.family.fetch(family)
    assert.ok(data.parent.equals(parent))
  })

  it("2. agrega un hijo con PDA derivada de la familia", async () => {
    const data = await pg.program.account.family.fetch(family)
    child = findPda([Buffer.from("child"), family.toBuffer(), u16(data.nextChildId)])
    const tx = await pg.program.methods
      .addChild("Betito")
      .accounts({ family, child, parent, systemProgram: web3.SystemProgram.programId })
      .rpc()
    console.log("  addChild tx:", tx)
    const childData = await pg.program.account.child.fetch(child)
    assert.ok(childData.family.equals(family))
  })

  it("3. crea una tarea pendiente", async () => {
    const childData = await pg.program.account.child.fetch(child)
    task = findPda([Buffer.from("task"), child.toBuffer(), u32(childData.nextTaskId)])
    const tx = await pg.program.methods
      .createTask("Ordenar la habitación", new BN(10))
      .accounts({ family, child, task, parent, systemProgram: web3.SystemProgram.programId })
      .rpc()
    console.log("  createTask tx:", tx)
    assert.equal((await pg.program.account.child.fetch(child)).pendingTasks, 1)
  })

  it("4. rechaza una recompensa inválida", async () => {
    await expectError(
      pg.program.methods.updateTaskReward(new BN(0)).accounts({ family, child, task, parent }).rpc(),
      "InvalidReward",
    )
  })

  it("5. actualiza la recompensa de una tarea pendiente", async () => {
    const tx = await pg.program.methods
      .updateTaskReward(new BN(15))
      .accounts({ family, child, task, parent })
      .rpc()
    console.log("  updateTaskReward tx:", tx)
    assert.equal((await pg.program.account.task.fetch(task)).reward.toNumber(), 15)
  })

  it("6. rechaza cerrar un hijo con tareas pendientes", async () => {
    await expectError(
      pg.program.methods.closeChild().accounts({ family, child, parent }).rpc(),
      "ChildHasPendingTasks",
    )
  })

  it("7. rechaza que otra wallet apruebe la tarea", async () => {
    const intruder = web3.Keypair.generate()
    await expectError(
      pg.program.methods
        .approveTask()
        .accounts({ family, child, task, parent: intruder.publicKey })
        .signers([intruder])
        .rpc(),
      "Unauthorized",
    )
  })

  it("8. aprueba la tarea y suma el saldo", async () => {
    const tx = await pg.program.methods.approveTask().accounts({ family, child, task, parent }).rpc()
    console.log("  approveTask tx:", tx)
    const childData = await pg.program.account.child.fetch(child)
    assert.equal(childData.balance.toNumber(), 15)
    assert.equal(childData.pendingTasks, 0)
  })

  it("9. rechaza aprobar dos veces la misma tarea", async () => {
    await expectError(
      pg.program.methods.approveTask().accounts({ family, child, task, parent }).rpc(),
      "TaskNotPending",
    )
  })

  it("10. cierra el hijo sin tareas pendientes y devuelve la renta", async () => {
    const tx = await pg.program.methods.closeChild().accounts({ family, child, parent }).rpc()
    console.log("  closeChild tx:", tx)
    assert.equal(await pg.program.account.child.fetchNullable(child), null)
  })
})
