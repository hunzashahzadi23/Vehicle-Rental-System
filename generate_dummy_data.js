const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, 'users.csv');
const govtFile = path.join(__dirname, 'government_registry.csv');
const vehiclesFile = path.join(__dirname, 'marketplace_vehicles.csv');
const bookingsFile = path.join(__dirname, 'bookings.csv');

// --- Helpers ---
const appendToCsv = (file, data) => {
  const line = data.join(',') + '\n';
  fs.appendFileSync(file, line);
};

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randEl = (arr) => arr[randInt(0, arr.length - 1)];

const names = ["Ahmed", "Fatima", "Bilal", "Ayesha", "Usman", "Zainab", "Omar", "Hira", "Saad", "Khadija", "Hamza", "Maryam", "Tariq", "Sara", "Imran", "Sana", "Fahad", "Nida", "Kamran", "Rabia"];
const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan"];

// --- Generate Data ---
let lessors = [];
let customers = [];
let vehiclesList = [];

// 1. Generate 20 Users
for (let i = 10; i < 30; i++) {
  const isLessor = i % 3 === 0;
  const role = isLessor ? 'Lessor' : 'Customer';
  const prefix = isLessor ? 'UL' : 'UC';
  const id = `${prefix}-00${i}`;
  const name = names[i - 10] + " " + names[(i - 9) % 20];
  const email = `${names[i - 10].toLowerCase()}${i}@example.com`;
  const password = "password123";
  const cnic = `35202-${randInt(1000000, 9999999)}-${randInt(1, 9)}`;
  const phone = `0300${randInt(1000000, 9999999)}`;
  const address = randEl(cities);
  const trust_score = (Math.random() * 2 + 3).toFixed(1); // 3.0 to 5.0
  const wallet_available = isLessor ? 0 : randInt(50000, 200000);
  const wallet_locked = 0;

  appendToCsv(usersFile, [id, name, email, password, role, cnic, phone, address, trust_score, wallet_available, wallet_locked]);
  
  if (isLessor) lessors.push({ id, name, cnic });
  else customers.push({ id, name });
}

// 2. Generate 20 Govt Registry Entries & Marketplace Vehicles
for (let i = 10; i < 30; i++) {
  // We'll assign these to the lessors we just created
  const lessor = lessors[i % lessors.length];
  
  // Govt Registry Data
  const cnic = lessor.cnic;
  const owner_name = lessor.name;
  const vehicle_number = `LEB-${randInt(1000, 9999)}`;
  const chassis_number = `WBA${randInt(100000000, 999999999)}`;
  const engine_number = `EN${randInt(100000, 999999)}`;
  const vehicle_type = randEl(['Sedan', 'SUV', 'Hatchback']);
  const registration_date = `202${randInt(0, 5)}-0${randInt(1, 9)}-15`;
  const status = 'Active';

  appendToCsv(govtFile, [cnic, owner_name, vehicle_number, chassis_number, engine_number, vehicle_type, registration_date, status]);

  // Marketplace Vehicle Data
  const vId = `VC-00${i}`;
  const brand = randEl(['Toyota', 'Honda', 'Suzuki', 'Kia', 'Hyundai']);
  const model = randEl(['Civic', 'Corolla', 'Sportage', 'Cultus', 'Tucson']);
  const year = randInt(2018, 2024);
  const rate = randInt(3000, 15000);
  const isLuxury = rate > 10000 ? 'true' : 'false';
  const available = 'true';
  const fuel = randEl(['Petrol', 'Hybrid']);
  const trans = randEl(['Automatic', 'Manual']);
  const seats = 5;
  const vStatus = 'Verified';
  const image = `https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600`;
  const rating = (Math.random() * 1.5 + 3.5).toFixed(1);

  appendToCsv(vehiclesFile, [vId, lessor.id, brand, model, year, vehicle_number, vehicle_type, rate, available, fuel, trans, seats, isLuxury, vStatus, image, rating]);
  vehiclesList.push({ vId, ownerID: lessor.id, rate });
}

// 3. Generate Dummy Bookings
const bookingStatuses = ['Completed', 'Active', 'PendingApproval', 'PendingInspection', 'Completed', 'Completed'];
for (let i = 10; i < 25; i++) {
  const bId = `BK-00${i}`;
  const customer = customers[i % customers.length];
  const vehicle = vehiclesList[i % vehiclesList.length];
  
  const status = randEl(bookingStatuses);
  const duration = randInt(2, 7);
  const cost = vehicle.rate * duration;
  const insurance = 'Standard';
  const deposit = 5000;
  
  // Fields that change based on status
  let rentDate = `2026-04-${randInt(10, 20)}`;
  let pVideo = status !== 'PendingApproval' ? 'https://example.com/video.mp4' : '';
  let rVideo = (status === 'PendingInspection' || status === 'Completed') ? 'https://example.com/ret.mp4' : '';
  let oChecklist = status !== 'PendingApproval' ? '"{""checklist"":{""fuel"":true},""dentDescription"":""""}"' : '';
  let cChecklist = (status === 'PendingInspection' || status === 'Completed') ? '"{""checklist"":{""fuel"":true},""dentDescription"":""""}"' : '';
  let cRating = status === 'Completed' ? 5 : 0;
  let cReview = status === 'Completed' ? 'Great car!' : '';
  let oRating = status === 'Completed' ? 5 : 0;
  let oReview = status === 'Completed' ? 'Good customer' : '';
  let pPaidDate = status === 'Completed' ? `2026-04-${randInt(21, 28)}` : '';
  let completedAt = status === 'Completed' ? `2026-04-${randInt(21, 28)}` : '';

  appendToCsv(bookingsFile, [bId, customer.id, vehicle.ownerID, vehicle.vId, rentDate, duration, cost, status, pVideo, rVideo, oChecklist, cChecklist, cRating, cReview, oRating, oReview, pPaidDate, completedAt, '', insurance, deposit]);
}

console.log('Dummy data generated successfully!');
