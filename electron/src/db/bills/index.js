import { getBills } from "./getBills.js";
import { addBill } from "./addBill.js";
import { deleteBill } from "./deleteBill.js";
import { payBill } from "./payBill.js";
import { checkDueBills } from "./checkDueBills.js";

export default {
    "get-bills": getBills,
    "add-bill": addBill,
    "delete-bill": deleteBill,
    "pay-bill": payBill,
    "check-due-bills": checkDueBills
};
