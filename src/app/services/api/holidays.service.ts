import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

export interface Holiday {
    date: string;
    name: string;
    type: string;
}

@Injectable({
    providedIn: 'root'
})
export class HolidaysService {
    constructor(
        private http: HttpClient
    ) { }

    getHolidays(year: number): Observable<Holiday[]> {
        return this.http.get<Holiday[]>(`https://brasilapi.com.br/api/feriados/v1/${year}`);
    }

    async getHolidaysAsPromise(year: number): Promise<Holiday[]> {
        try {
            return await firstValueFrom(this.getHolidays(year));
        } catch (e) {
            console.warn('Could not fetch holidays for', year, e);
            return [];
        }
    }

    async getFifthBusinessDayOfNextMonth(currentDate: Date = new Date()): Promise<Date> {
        let year = currentDate.getFullYear();
        let month = currentDate.getMonth() + 1; // next month

        if (month > 11) {
            month = 0;
            year++;
        }

        const holidays = await this.getHolidaysAsPromise(year);
        const holidayDates = new Set(holidays.map(h => h.date));

        let businessDaysCount = 0;
        let day = 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let fifthBusinessDay = new Date(year, month, 5); // fallback

        while (day <= daysInMonth) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            
            const isoYear = date.getFullYear();
            const isoMonth = String(date.getMonth() + 1).padStart(2, '0');
            const isoDay = String(date.getDate()).padStart(2, '0');
            const dateString = `${isoYear}-${isoMonth}-${isoDay}`;

            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = holidayDates.has(dateString);

            if (!isWeekend && !isHoliday) {
                businessDaysCount++;
                if (businessDaysCount === 5) {
                    fifthBusinessDay = date;
                    break;
                }
            }
            day++;
        }

        return fifthBusinessDay;
    }
}
