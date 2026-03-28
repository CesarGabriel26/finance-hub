import { recalculateAccountBalance } from "./recalculateAccountBalance.js";
import { getAccounts } from "./getAccounts.js";
import { addAccount } from "./addAccount.js";
import { deleteAccount } from "./deleteAccount.js";
import { updateAccountBalance } from "./updateAccountBalance.js";
import { updateAccountName } from "./updateAccountName.js";

export default {
    "recalculate-balance": async (_, accountId) => {
        await recalculateAccountBalance(accountId);
        return { success: true };
    },
    "get-accounts": getAccounts,
    "add-account": addAccount,
    "delete-account": deleteAccount,
    "update-account-balance": updateAccountBalance,
    "update-account-name": updateAccountName
};
