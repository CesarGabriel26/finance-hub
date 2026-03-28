import { getAssets } from "./getAssets.js";
import { addAsset } from "./addAsset.js";
import { updateAsset } from "./updateAsset.js";
import { deleteAsset } from "./deleteAsset.js";
import { getInvestmentEntries } from "./getInvestmentEntries.js";
import { addInvestmentEntry } from "./addInvestmentEntry.js";
import { deleteInvestmentEntry } from "./deleteInvestmentEntry.js";
import { getAllInvestmentEntries } from "./getAllInvestmentEntries.js";

export default {
    "get-assets": getAssets,
    "add-asset": addAsset,
    "update-asset": updateAsset,
    "delete-asset": deleteAsset,
    "get-investment-entries": getInvestmentEntries,
    "add-investment-entry": addInvestmentEntry,
    "delete-investment-entry": deleteInvestmentEntry,
    "get-all-investment-entries": getAllInvestmentEntries
};
