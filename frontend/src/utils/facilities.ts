export interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  included?: boolean;
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  description: string;
  hours: {
    weekday: string;
    weekend: string;
  };
  lightingFee: number;
  lightingStartTime: string;
  includedEquipment: string[];
  availableEquipment: EquipmentItem[];
  notes: string[];
  capacity?: number;
  bookingRequired: boolean;
  image: string;
}

/* --------------------------------------------------
   OFFICIAL AUI FACILITIES RULES (UPDATED)
--------------------------------------------------- */

export const facilities: Facility[] = [
  /* -------------------- FUTSAL (PROXY) -------------------- */
  {
    id: "futsal", // backend expects "futsal"
    name: "5v5 Futsal Court (Proxy Area)",
    type: "futsal",
    description: "Small futsal 5v5 court next to the proxy area.",
    hours: {
      weekday: "08:00 - 21:00",
      weekend: "13:00 - 21:00",
    },
    lightingFee: 30,
    lightingStartTime: "18:00",
    includedEquipment: ["1 Futsal Ball"],
    availableEquipment: [
      { id: "bib", name: "Training Bibs", quantity: 10 },
      { id: "cones", name: "Training Cones", quantity: 12 }
    ],
    notes: ["Be respectful of shared space"],
    bookingRequired: true,
    capacity: 10,
    image: "/courts/futsal.jpg",
  },

  /* -------------------- SOCCER HALF FIELD LEFT -------------------- */
  {
    id: "newfield-half-a", // backend expects "newfield-half-a"
    name: "New Soccer Field – Left Side",
    type: "soccer",
    description: "Half-field booking on new soccer field (left side).",
    hours: {
      weekday: "08:00 - 21:00",
      weekend: "13:00 - 21:00",
    },
    lightingFee: 40,
    lightingStartTime: "18:00",
    includedEquipment: ["4 Footballs"],
    availableEquipment: [
      { id: "bib", name: "Training Bibs", quantity: 12 },
      { id: "cones", name: "Training Cones", quantity: 20 }
    ],
    notes: ["Field divided into left and right"],
    bookingRequired: true,
    capacity: 14,
    image: "/courts/soccer.jpg",
  },

  /* -------------------- SOCCER HALF FIELD RIGHT -------------------- */
  {
    id: "newfield-half-b", // backend expects "newfield-half-b"
    name: "New Soccer Field – Right Side",
    type: "soccer",
    description: "Half-field booking on new soccer field (right side).",
    hours: {
      weekday: "08:00 - 21:00",
      weekend: "13:00 - 21:00",
    },
    lightingFee: 40,
    lightingStartTime: "18:00",
    includedEquipment: ["4 Footballs"],
    availableEquipment: [
      { id: "bib", name: "Training Bibs", quantity: 12 },
      { id: "cones", name: "Training Cones", quantity: 20 }
    ],
    notes: ["Field divided into left and right"],
    bookingRequired: true,
    capacity: 14,
    image: "/courts/soccer.jpg",
  },

  /* -------------------- TENNIS COURT 1 -------------------- */
  {
    id: "tennis-1",
    name: "Tennis Court 1",
    type: "tennis",
    description: "Outdoor tennis court with lighting.",
    hours: {
      weekday: "08:00 - 21:00",
      weekend: "13:00 - 21:00",
    },
    lightingFee: 30,
    lightingStartTime: "18:00",
    includedEquipment: ["1 Tennis Racket"],
    availableEquipment: [
      { id: "racket", name: "Extra Tennis Racket", quantity: 3 },
      { id: "balls", name: "Tennis Balls", quantity: 6, included: true }
    ],
    notes: ["Wear proper shoes"],
    bookingRequired: true,
    capacity: 4,
    image: "/courts/tennis.jpg",
  },

  /* -------------------- TENNIS COURT 2 -------------------- */
  {
    id: "tennis-2",
    name: "Tennis Court 2",
    type: "tennis",
    description: "Second outdoor tennis court.",
    hours: {
      weekday: "08:00 - 21:00",
      weekend: "13:00 - 21:00",
    },
    lightingFee: 30,
    lightingStartTime: "18:00",
    includedEquipment: ["1 Tennis Racket"],
    availableEquipment: [
      { id: "racket", name: "Extra Tennis Racket", quantity: 3 },
      { id: "balls", name: "Tennis Balls", quantity: 6, included: true }
    ],
    notes: ["Court subject to availability"],
    bookingRequired: true,
    capacity: 4,
    image: "/courts/tennis.jpg",
  },

  /* -------------------- PADEL -------------------- */
  {
    id: "padel",
    name: "Padel Court",
    type: "padel",
    description: "Standard single padel court.",
    hours: {
      weekday: "08:00 - 21:00",
      weekend: "13:00 - 21:00",
    },
    lightingFee: 30,
    lightingStartTime: "18:00",
    includedEquipment: ["1 Padel Racket"],
    availableEquipment: [
      { id: "padel-racket", name: "Padel Racket", quantity: 4 },
      { id: "balls", name: "Padel Balls", quantity: 8, included: true }
    ],
    notes: ["Indoor shoes recommended"],
    bookingRequired: true,
    capacity: 4,
    image: "/courts/padel.jpg",
  },

  /* -------------------- BASKETBALL MINI-COURT -------------------- */
  {
    id: "basket-mini",
    name: "Basketball Mini-Court (Gym Side)",
    type: "basketball",
    description: "Small non-bookable basketball court.",
    hours: {
      weekday: "08:00 - 21:00",
      weekend: "13:00 - 21:00",
    },
    lightingFee: 0,
    lightingStartTime: "00:00",
    includedEquipment: [],
    availableEquipment: [],
    notes: [
      "First-come, first-served",
      "Booking not required",
      "Small court"
    ],
    bookingRequired: false,
    capacity: 8,
    image: "/courts/basketball.jpg",
  },

  /* -------------------- BICYCLES RENTAL -------------------- */
  {
    id: "bicycles",
    name: "Campus Bicycles",
    type: "bicycles",
    description: "Hourly bicycle rentals to move around campus.",
    hours: {
      weekday: "08:00 - 18:00",
      weekend: "10:00 - 18:00",
    },
    lightingFee: 0,
    lightingStartTime: "99:00",
    includedEquipment: ["1 Bicycle"],
    availableEquipment: [
      { id: "helmet", name: "Helmet", quantity: 10, included: true },
      { id: "lock", name: "Bike Lock", quantity: 10 }
    ],
    notes: [
      "Return bicycles in good condition.",
      "Report any mechanical issues immediately."
    ],
    bookingRequired: true,
    capacity: 1,
    image: "/courts/bicycles.jpg",
  },
];

/* --------------------------------------------------
   DYNAMIC TIME SLOTS BASED ON REAL HOURS
--------------------------------------------------- */

export function generateTimeSlots(facilityId: string, date: Date): string[] {
  const facility = facilities.find(f => f.id === facilityId);
  if (!facility) return [];

  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  const range = isWeekend ? facility.hours.weekend : facility.hours.weekday;

  const [start, end] = range.split(" - ");
  const startHour = parseInt(start.split(":")[0]);
  const endHour = parseInt(end.split(":")[0]);

  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${h}:00`);
  }
  return slots;
}


/* --------------------------------------------------
   PRICE CALCULATOR — WITH BICYCLE RULE
   (equipment is always FREE)
--------------------------------------------------- */

export function calculatePrice(
  facilityId: string,
  time: string,
  _selectedEquipment: { name: string; quantity: number }[],
): number {
  const facility = facilities.find((f) => f.id === facilityId);
  if (!facility) return 0;

  // 🚲 Bicycles: detailed pricing is handled in FacilityDetailPage
  if (facility.type === 'bicycles') {
    return 0;
  }

  const hour = parseInt(time.split(':')[0]);
  const lightingStart = parseInt(facility.lightingStartTime.split(':')[0]);

  let price = 0;

  // 💡 Lighting fee only (courts in the evening)
  if (hour >= lightingStart && facility.lightingFee > 0) {
    price += facility.lightingFee;
  }

  // 🆓 Equipment is always free – no extra price added
  return price;
}

 
