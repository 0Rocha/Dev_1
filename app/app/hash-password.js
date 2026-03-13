const bcrypt = require("bcryptjs");

async function run() {
  const senha = "123456";
  const hash = await bcrypt.hash(senha, 10);
  console.log(hash);
}

run();
