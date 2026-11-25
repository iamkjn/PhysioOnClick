import { outwardCode } from "@/lib/home-visit-area";

/**
 * Post town for each home-visit postcode district, so the booking form can fill
 * "Town / city" without sending the postcode to a lookup service. The field
 * stays editable; districts not listed are left for the patient to type.
 */
const TOWNS: Record<string, string> = {};
function add(town: string, prefix: string, ...districts: number[]) {
  for (const n of districts) TOWNS[`${prefix}${n}`] = town;
}
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

add("Glasgow", "G", ...range(1, 53), 60, 63, 69, 72, 76);
for (const [n, town] of Object.entries({
  61: "Bearsden", 62: "Milngavie", 64: "Bishopbriggs", 65: "Kilsyth", 66: "Kirkintilloch", 67: "Cumbernauld",
  68: "Cumbernauld", 71: "Uddingston", 73: "Rutherglen", 74: "East Kilbride", 75: "East Kilbride",
  77: "Newton Mearns", 78: "Barrhead", 81: "Clydebank", 82: "Dumbarton", 83: "Alexandria", 84: "Helensburgh",
})) TOWNS[`G${n}`] = town;

add("Paisley", "PA", 1, 2, 3);
add("Renfrew", "PA", 4);
add("Johnstone", "PA", 5, 6, 9, 10);
add("Bishopton", "PA", 7);
add("Erskine", "PA", 8);
add("Bridge of Weir", "PA", 11);
add("Lochwinnoch", "PA", 12);
add("Kilmacolm", "PA", 13);
add("Port Glasgow", "PA", 14);
add("Greenock", "PA", 15, 16);
add("Skelmorlie", "PA", 17);
add("Wemyss Bay", "PA", 18);
add("Gourock", "PA", 19);

["Motherwell", "Wishaw", "Hamilton", "Bellshill", "Coatbridge", "Airdrie", "Shotts", "Carluke", "Larkhall",
  "Strathaven", "Lanark", "Biggar"].forEach((town, i) => add(town, "ML", i + 1));

add("Kilmarnock", "KA", 1, 2, 3);
add("Galston", "KA", 4);
add("Mauchline", "KA", 5);
add("Ayr", "KA", 6, 7, 8);
add("Prestwick", "KA", 9);
add("Troon", "KA", 10);
add("Irvine", "KA", 11, 12);
add("Kilwinning", "KA", 13);
add("Beith", "KA", 14, 15);
add("Newmilns", "KA", 16);
add("Darvel", "KA", 17);
add("Cumnock", "KA", 18);
add("Maybole", "KA", 19);
add("Stevenston", "KA", 20);
add("Saltcoats", "KA", 21);
add("Ardrossan", "KA", 22);
add("West Kilbride", "KA", 23);
add("Dalry", "KA", 24);
add("Kilbirnie", "KA", 25);
add("Largs", "KA", 29, 30);

add("Falkirk", "FK", 1, 2);
add("Grangemouth", "FK", 3);
add("Bonnybridge", "FK", 4);
add("Larbert", "FK", 5);
add("Denny", "FK", 6);
add("Stirling", "FK", 7, 8, 9);
add("Alloa", "FK", 10);
add("Menstrie", "FK", 11);
add("Alva", "FK", 12);
add("Tillicoultry", "FK", 13);
add("Dollar", "FK", 14);
add("Dunblane", "FK", 15);
add("Doune", "FK", 16);

add("Kirknewton", "EH", 27);
add("Newbridge", "EH", 28);
add("Kirkliston", "EH", 29);
add("South Queensferry", "EH", 30);
add("Bathgate", "EH", 47, 48);
add("Linlithgow", "EH", 49);
add("Bo'ness", "EH", 51);
add("Broxburn", "EH", 52);
add("Livingston", "EH", 53, 54);
add("West Calder", "EH", 55);
add("Dunfermline", "KY", 11, 12);
add("Kinross", "KY", 13);

/** "g72 8fe" -> "Glasgow"; "" when the district isn't one we know. */
export function postTown(postcode: string): string {
  return TOWNS[outwardCode(postcode)] ?? "";
}
