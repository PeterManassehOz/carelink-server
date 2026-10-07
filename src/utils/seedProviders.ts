import dotenv from "dotenv";

import { connectDatabase } from "../config/db.js";
import { Provider } from "../models/Provider.js";

dotenv.config();

const providers = [
  {
    name: "Dr. Sarah Johnson",
    specialty: "General Practitioner",
    description:
      "Experienced general practitioner providing comprehensive primary healthcare and routine medical consultations.",
    location: "Central Medical Centre, Abuja",
    phone: "+2348012345001",
    email: "sarah.johnson@carelink.test",
    image: "https://i.pravatar.cc/300?img=47",
    availability: [
      {
        day: "Monday",
        startTime: "09:00",
        endTime: "16:00",
      },
      {
        day: "Wednesday",
        startTime: "09:00",
        endTime: "16:00",
      },
      {
        day: "Friday",
        startTime: "09:00",
        endTime: "13:00",
      },
    ],
  },

  {
    name: "Dr. Michael Adeyemi",
    specialty: "Cardiologist",
    description:
      "Cardiologist focused on cardiovascular health, heart disease prevention, diagnosis, and long-term care.",
    location: "HeartCare Clinic, Lagos",
    phone: "+2348012345002",
    email: "michael.adeyemi@carelink.test",
    image: "https://i.pravatar.cc/300?img=12",
    availability: [
      {
        day: "Tuesday",
        startTime: "10:00",
        endTime: "17:00",
      },
      {
        day: "Thursday",
        startTime: "10:00",
        endTime: "17:00",
      },
    ],
  },

  {
    name: "Dr. Emily Williams",
    specialty: "Dermatologist",
    description:
      "Dermatologist providing assessment and treatment for common skin, hair, and nail conditions.",
    location: "Wellness Medical Centre, Port Harcourt",
    phone: "+2348012345003",
    email: "emily.williams@carelink.test",
    image: "https://i.pravatar.cc/300?img=44",
    availability: [
      {
        day: "Monday",
        startTime: "10:00",
        endTime: "15:00",
      },
      {
        day: "Thursday",
        startTime: "10:00",
        endTime: "15:00",
      },
    ],
  },

  {
    name: "Dr. David Okafor",
    specialty: "Pediatrician",
    description:
      "Pediatrician providing healthcare services for infants, children, and adolescents.",
    location: "Family Health Hospital, Enugu",
    phone: "+2348012345004",
    email: "david.okafor@carelink.test",
    image: "https://i.pravatar.cc/300?img=68",
    availability: [
      {
        day: "Tuesday",
        startTime: "09:00",
        endTime: "14:00",
      },
      {
        day: "Friday",
        startTime: "09:00",
        endTime: "14:00",
      },
    ],
  },

  {
    name: "Dr. Grace Ibrahim",
    specialty: "Dentist",
    description:
      "Dentist providing preventive, restorative, and general dental care for adults and children.",
    location: "BrightSmile Dental Clinic, Kano",
    phone: "+2348012345005",
    email: "grace.ibrahim@carelink.test",
    image: "https://i.pravatar.cc/300?img=32",
    availability: [
      {
        day: "Monday",
        startTime: "09:00",
        endTime: "15:00",
      },
      {
        day: "Wednesday",
        startTime: "09:00",
        endTime: "15:00",
      },
      {
        day: "Saturday",
        startTime: "10:00",
        endTime: "13:00",
      },
    ],
  },
];

async function seedProviders(): Promise<void> {
  try {
    await connectDatabase();

    await Provider.deleteMany({});

    await Provider.insertMany(providers);

    console.log(`${providers.length} providers seeded successfully`);

    process.exit(0);
  } catch (error) {
    console.error("Failed to seed providers:", error);

    process.exit(1);
  }
}

seedProviders();