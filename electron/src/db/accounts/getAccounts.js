import { dbAll } from "../../services/database.services.js";

export async function getAccounts() {
    return await dbAll("SELECT * FROM accounts ORDER BY name");
}
