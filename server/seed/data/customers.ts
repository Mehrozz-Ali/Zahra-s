
export interface DemoCustomer {
  name: string;
  phone: string;
  city: string;
  province: string;
  line1: string;
  postalCode: string;
  daysAgo: number;
  isActive?: boolean;
  isEmailVerified?: boolean;
}

/** Sample shoppers. Their email is made from their name at the reserved domain demo.example, which is how `seed:reset` finds them. */
export const DEMO_EMAIL_DOMAIN = "demo.example";
export const demoEmail = (name: string): string => `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@${DEMO_EMAIL_DOMAIN}`;

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  { name: "Ayesha Khan", phone: "03001234567", city: "Lahore", province: "Punjab", line1: "House 24, Street 7, Gulberg III", postalCode: "54660", daysAgo: 110 },
  { name: "Fatima Zahra", phone: "03211234890", city: "Karachi", province: "Sindh", line1: "Flat 8, Block B, Clifton", postalCode: "75600", daysAgo: 104 },
  { name: "Hina Malik", phone: "03331122334", city: "Islamabad", province: "Islamabad Capital Territory", line1: "House 12, Street 40, F-10/3", postalCode: "44000", daysAgo: 98 },
  { name: "Sana Iqbal", phone: "03451239876", city: "Rawalpindi", province: "Punjab", line1: "House 55, Satellite Town", postalCode: "46300", daysAgo: 90 },
  { name: "Mehwish Ali", phone: "03123456780", city: "Faisalabad", province: "Punjab", line1: "House 3, Peoples Colony No. 1", postalCode: "38000", daysAgo: 80 },
  { name: "Nimra Shah", phone: "03029988776", city: "Peshawar", province: "Khyber Pakhtunkhwa", line1: "House 17, Hayatabad Phase 3", postalCode: "25000", daysAgo: 70 },
  { name: "Rabia Hussain", phone: "03154433221", city: "Multan", province: "Punjab", line1: "House 9, Shah Rukn-e-Alam Colony", postalCode: "60000", daysAgo: 45, isEmailVerified: false },
  { name: "Komal Raza", phone: "03005566778", city: "Hyderabad", province: "Sindh", line1: "House 21, Latifabad Unit 7", postalCode: "71800", daysAgo: 40, isActive: false },
];

