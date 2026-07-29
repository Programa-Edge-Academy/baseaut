import { withOpacity } from '@/components/color-opacity';
import { useThemeColors } from '@/features/settings/contexts/theme-context';
import React, { useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { DateData, MarkedDates } from 'react-native-calendars/src/types';

LocaleConfig.locales['pt-br'] = {
    monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    dayNamesShort: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
    today: ['Hoje']
};
LocaleConfig.defaultLocale = 'pt-br';

/** Props for {@link RangeCalendar}. */
interface RangeCalendarProps {
    /**
     * Called when a selection changes. In single mode `end` is null; in range
     * mode it is the inclusive end of the selected interval.
     */
    onRangeSelected: (start: string, end: string | null) => void;
    /** Selection mode. Defaults to "range". */
    mode?: 'range' | 'single';
    style?: StyleProp<ViewStyle>;
}

/**
 * Calendar with single-day or date-range selection, localized to pt-BR and
 * themed to match the app. Dates after today are disabled.
 */
const RangeCalendar: React.FC<RangeCalendarProps> = ({ onRangeSelected, mode = 'range', style }) => {
    const colors = useThemeColors();
    const CALENDAR_BG = colors.level2;
    const ACCENT_COLOR = colors.primary;
    const ACCENT_RANGE_BG = withOpacity(colors.primary, 0.1);
    const DAY_TEXT = colors.content;
    const HEADER_TEXT = colors.muted;
    const MONTH_TEXT = colors.content;
    const ARROW_COLOR = colors.muted;

    const [markedDates, setMarkedDates] = useState<MarkedDates>({});
    const [startDate, setStartDate] = useState<string | null>(null);

    const handleDayPress = (day: DateData) => {
        const dateString = day.dateString;

        if (mode === 'single') {
            setMarkedDates({
                [dateString]: { selected: true, selectedColor: ACCENT_COLOR, textColor: DAY_TEXT }
            });
            onRangeSelected(dateString, null);
            return;
        }

        const keys = Object.keys(markedDates);

        if (!startDate || (startDate && keys.length > 1)) {
            setStartDate(dateString);

            const newMarked: MarkedDates = {
                [dateString]: { 
                    startingDay: true, 
                    endingDay: true, 
                    color: ACCENT_COLOR, 
                    textColor: DAY_TEXT 
                }
            };

            setMarkedDates(newMarked);
            onRangeSelected(dateString, null);
        }
        else {
            let start = startDate;
            let end = dateString;

            if (dateString === start) {
                const newMarked: MarkedDates = {
                    [dateString]: { 
                        startingDay: true, 
                        endingDay: true, 
                        color: ACCENT_COLOR, 
                        textColor: DAY_TEXT 
                    }
                };
                setStartDate(null);
                setMarkedDates(newMarked);
                onRangeSelected(dateString, dateString);
                return;
            }

            if (dateString < start) {
                end = start;
                start = dateString;
            }

            const newMarked: MarkedDates = {
                [start]: { startingDay: true, color: ACCENT_COLOR, textColor: DAY_TEXT }
            };

            const [startYear, startMonth, startDay] = start.split('-').map(Number);
            const [endYear, endMonth, endDay] = end.split('-').map(Number);

            const current = new Date(startYear, startMonth - 1, startDay);
            const targetEnd = new Date(endYear, endMonth - 1, endDay);

            current.setDate(current.getDate() + 1);

            while (current < targetEnd) {
                const yyyy = current.getFullYear();
                const mm = String(current.getMonth() + 1).padStart(2, '0');
                const dd = String(current.getDate()).padStart(2, '0');
                
                const middleDateString = `${yyyy}-${mm}-${dd}`;
                newMarked[middleDateString] = { color: ACCENT_RANGE_BG, textColor: DAY_TEXT };
                
                current.setDate(current.getDate() + 1);
            }

            newMarked[end] = { endingDay: true, color: ACCENT_COLOR, textColor: DAY_TEXT };

            setStartDate(null);
            setMarkedDates(newMarked);
            onRangeSelected(start, end);
        }
    };

    return (
        <View
            style={[
                {
                    backgroundColor: CALENDAR_BG,
                    borderRadius: 8,
                    elevation: 6,
                    shadowColor: '#000',
                    shadowOffset: { width: 2, height: 16 },
                    shadowOpacity: 0.09,
                    shadowRadius: 19,
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Calendar
                markingType={mode === 'single' ? 'dot' : 'period'}
                markedDates={markedDates}
                onDayPress={handleDayPress}
                maxDate={new Date().toISOString().split('T')[0]}
                theme={{
                    calendarBackground: CALENDAR_BG,
                    monthTextColor: MONTH_TEXT,
                    textMonthFontSize: 14,
                    textMonthFontFamily: 'Inter-Bold',
                    dayTextColor: DAY_TEXT,
                    textDayFontSize: 16,
                    textDayFontFamily: 'Inter-Medium',
                    todayTextColor: ACCENT_COLOR,
                    textDisabledColor: colors.muted,
                    textInactiveColor: colors.muted,
                    textSectionTitleColor: HEADER_TEXT,
                    textDayHeaderFontSize: 10,
                    textDayHeaderFontFamily: 'Inter-Bold',
                    arrowColor: ARROW_COLOR,
                }}
                style={{ borderRadius: 8, paddingVertical: 4, width: '100%' }}
            />
        </View>
    );
};

export default RangeCalendar;