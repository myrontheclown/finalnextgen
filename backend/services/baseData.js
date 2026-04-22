/**
 * Base Data Factory v6.0
 */

function getValidUser() {
  return {
    id: Date.now(),
    username: "testUser",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    password: "test123",
    phone: "9999999999",
    userStatus: 1
  };
}

function getValidPet() {
  return {
    id: 1,
    name: "doggie",
    status: "available"
  };
}

function getValidOrder() {
  return {
    id: 1,
    petId: 1,
    quantity: 1,
    shipDate: new Date().toISOString(),
    status: "placed",
    complete: true
  };
}

module.exports = { getValidUser, getValidPet, getValidOrder };
