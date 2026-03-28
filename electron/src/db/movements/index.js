import { getMovements } from "./getMovements.js";
import { addMovement } from "./addMovement.js";
import { updateMovement } from "./updateMovement.js";
import { deleteMovement } from "./deleteMovement.js";
import { getMovementsForReview } from "./getMovementsForReview.js";
import { closePeriod } from "./closePeriod.js";
import { recategorizeMovements } from "./recategorizeMovements.js";
import { getRecentMovements } from "./getRecentMovements.js";

export default {
    "get-movements": getMovements,
    "add-movement": addMovement,
    "update-movement": updateMovement,
    "delete-movement": deleteMovement,
    "get-movements-for-review": getMovementsForReview,
    "close-period": closePeriod,
    "recategorize-movements": recategorizeMovements,
    "get-recent-movements": getRecentMovements
};
