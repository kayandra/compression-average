import { faker } from "@faker-js/faker";

export function createRandomPayload() {
  return {
    id: faker.string.uuid(),
    fullname: faker.person.fullName(),
    username: faker.internet.userName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    password: faker.internet.password(),
    birthdate: faker.date.birthdate(),
    createdAt: faker.date.past(),
  };
}
