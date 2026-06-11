import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { DateData, MarkedDates } from 'react-native-calendars/src/types';

LocaleConfig.locales['pt-br'] = {
    monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    dayNamesShort: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
    today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// Figma design tokens
const CALENDAR_BG = '#464646';
const ACCENT_COLOR = '#F04D23';
const ACCENT_RANGE_BG = 'rgba(240, 77, 35, 0.25)';
const DAY_TEXT = '#FFFFFF';
const HEADER_TEXT = '#B5BEC6';
const MONTH_TEXT = '#FFFFFF';
const ARROW_COLOR = '#B5BEC6';

interface RangeCalendarProps {
    onRangeSelected: (start: string, end: string | null) => void;
}

const RangeCalendar: React.FC<RangeCalendarProps> = ({ onRangeSelected }) => {
    const [markedDates, setMarkedDates] = useState<MarkedDates>({});
    const [startDate, setStartDate] = useState<string | null>(null);

    const handleDayPress = (day: DateData) => {
        const dateString = day.dateString;

        if (!startDate || (startDate && Object.keys(markedDates).length > 1)) {
            setStartDate(dateString);

            const newMarked: MarkedDates = {
                [dateString]: { startingDay: true, color: ACCENT_COLOR, textColor: DAY_TEXT }
            };

            setMarkedDates(newMarked);
            onRangeSelected(dateString, null);
        }
        else {
            if (new Date(dateString) < new Date(startDate)) {
                setStartDate(dateString);
                setMarkedDates({
                    [dateString]: { startingDay: true, color: ACCENT_COLOR, textColor: DAY_TEXT }
                });
                onRangeSelected(dateString, null);
                return;
            }

            const newMarked: MarkedDates = {
                [startDate]: { startingDay: true, color: ACCENT_COLOR, textColor: DAY_TEXT }
            };

            let currentDate = new Date(startDate);
            const endDate = new Date(dateString);

            currentDate.setDate(currentDate.getDate() + 1);

            while (currentDate < endDate) {
                const middleDateString = currentDate.toISOString().split('T')[0];
                newMarked[middleDateString] = { color: ACCENT_RANGE_BG, textColor: DAY_TEXT };
                currentDate.setDate(currentDate.getDate() + 1);
            }

            newMarked[dateString] = { endingDay: true, color: ACCENT_COLOR, textColor: DAY_TEXT };

            setMarkedDates(newMarked);
            onRangeSelected(startDate, dateString);
        }
    };

    return (
        <View style={styles.card}>
            <Calendar
                markingType={'period'}
                markedDates={markedDates}
                onDayPress={handleDayPress}
                maxDate={new Date().toISOString().split('T')[0]}
                theme={{
                    // Calendar container
                    calendarBackground: CALENDAR_BG,

                    // Month header
                    monthTextColor: MONTH_TEXT,
                    textMonthFontSize: 14,
                    textMonthFontWeight: '600',

                    // Day numbers
                    dayTextColor: DAY_TEXT,
                    textDayFontSize: 16,
                    textDayFontWeight: '600',

                    // Today
                    todayTextColor: ACCENT_COLOR,

                    // Disabled / other month days
                    textDisabledColor: '#6B6B6B',
                    textInactiveColor: '#6B6B6B',

                    // Weekday header (DOM, SEG, TER…)
                    textSectionTitleColor: HEADER_TEXT,
                    textDayHeaderFontSize: 10,
                    textDayHeaderFontWeight: '600',

                    // Navigation arrows
                    arrowColor: ARROW_COLOR,
                }}
                style={styles.calendar}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: CALENDAR_BG,
        borderRadius: 8,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 16 },
        shadowOpacity: 0.09,
        shadowRadius: 19,
        overflow: 'hidden',
    },
    calendar: {
        borderRadius: 8,
        paddingVertical: 4,
    },
});

export default RangeCalendar;