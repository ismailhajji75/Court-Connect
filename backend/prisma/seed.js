import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const facilities = [
  { id: "futsal", name: "Futsal Court 5v5", type: "futsal", location: "AUI Indoor Futsal Court" },
  { id: "newfield-half-a", name: "New Field - Half A", type: "half_field", location: "AUI New Field - Half A" },
  { id: "newfield-half-b", name: "New Field - Half B", type: "half_field", location: "AUI New Field - Half B" },
  { id: "tennis-1", name: "Tennis Court 1", type: "tennis", location: "AUI Tennis Court 1" },
  { id: "tennis-2", name: "Tennis Court 2", type: "tennis", location: "AUI Tennis Court 2" },
  { id: "basketball", name: "Basketball Court", type: "basketball", location: "AUI Basketball Court" },
  { id: "padel", name: "Padel Court", type: "padel", location: "AUI Padel Court" },
  { id: "bicycles", name: "Bicycles", type: "bicycles", location: "AUI Bike Rental" },
];

const adminUsers = [
  {
    username: "Admin",
    email: "a.admin@aui.ma",
    role: "ADMIN",
    balance: 9999,
    password: "admin123",
  },
  {
    username: "SuperAdmin",
    email: "superadmin@courtconnect.com",
    role: "SUPERADMIN",
    balance: 9999,
    password: "Q!7zP@92kL#tX4mB",
  },
  {
    username: "Nabil",
    email: "n.bachiri@aui.ma",
    role: "STUDENT",
    balance: 200,
    password: "nabil123",
  },
  {
    username: "Imane",
    email: "i.hajji@aui.ma",
    role: "STUDENT",
    balance: 150,
    password: "imane123",
  },
  {
    username: "Wassim Assili",
    email: "w.assili@aui.ma",
    role: "STUDENT",
    balance: 100,
    password: "wassim123",
  },
  {
    username: "Rim Amzid",
    email: "r.amzid@aui.ma",
    role: "STUDENT",
    balance: 100,
    password: "rim123",
  },
  {
    username: "Ismail Hajji",
    email: "i.hajji2@aui.ma",
    role: "STUDENT",
    balance: 100,
    password: "ismail123",
  },
];

async function main() {
  // Facilities
  for (const f of facilities) {
    await prisma.facility.upsert({
      where: { id: f.id },
      update: {
        name: f.name,
        description: f.type,
        location: f.location,
        isActive: true,
      },
      create: {
        id: f.id,
        name: f.name,
        description: f.type,
        location: f.location,
        isActive: true,
      },
    });
  }

  // Users
  for (const user of adminUsers) {
    const hashed = bcrypt.hashSync(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email.toLowerCase() },
      update: {
        username: user.username,
        role: user.role,
        balance: user.balance,
        password: hashed,
      },
      create: {
        username: user.username,
        email: user.email.toLowerCase(),
        role: user.role,
        balance: user.balance,
        password: hashed,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
