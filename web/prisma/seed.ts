import { db } from "@buds/server/db";
import { faker } from "@faker-js/faker";

faker.seed(12345);

const main = async () => {
  for (let i = 0; i < 10; i++) {
    await db.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
      },
    });
  }
};

Promise.resolve()
  .then(main)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
