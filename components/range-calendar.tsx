import React, { useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
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
    style?: StyleProp<ViewStyle>;
}

const RangeCalendar: React.FC<RangeCalendarProps> = ({ onRangeSelected, style }) => {
    const [markedDates, setMarkedDates] = useState<MarkedDates>({});
    const [startDate, setStartDate] = useState<string | null>(null);

    const handleDayPress = (day: DateData) => {
        const dateString = day.dateString;

        // Detecta se atualmente temos apenas UM único dia selecionado no calendário
        const keys = Object.keys(markedDates);
        const hasSingleDateSelected = keys.length === 1 && markedDates[keys[0]]?.startingDay && markedDates[keys[0]]?.endingDay;

        // Caso 1: Primeiro clique absoluto OU reset (se já havia um intervalo real com dias diferentes selecionados)
        if (!startDate && !hasSingleDateSelected) {
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
        // Caso 2: Segundo clique (ou continuação a partir de uma data isolada)
        else {
            // Se tiver o startDate na memória, usa-o. Se não tiver (pós duplo clique), pega a chave que já estava marcada
            let start = startDate || keys[0];
            let end = dateString;

            // Se clicar exatamente no mesmo dia de novo, apenas mantém o círculo perfeito isolado e não faz nada
            if (dateString === start) {
                const newMarked: MarkedDates = {
                    [dateString]: { 
                        startingDay: true, 
                        endingDay: true, 
                        color: ACCENT_COLOR, 
                        textColor: DAY_TEXT 
                    }
                };
                setStartDate(null); // Remove do estado para indicar que está fixado como data única por enquanto
                setMarkedDates(newMarked);
                onRangeSelected(dateString, dateString);
                return;
            }

            // Seleção independente: se clicar numa data anterior, rearranja os ponteiros automaticamente
            if (dateString < start) {
                end = start;
                start = dateString;
            }

            // Inicializa o objeto de marcação com o dia de início do período
            const newMarked: MarkedDates = {
                [start]: { startingDay: true, color: ACCENT_COLOR, textColor: DAY_TEXT }
            };

            // Evita problemas de fuso horário local quebrando as strings manualmente
            const [startYear, startMonth, startDay] = start.split('-').map(Number);
            const [endYear, endMonth, endDay] = end.split('-').map(Number);

            const current = new Date(startYear, startMonth - 1, startDay);
            const targetEnd = new Date(endYear, endMonth - 1, endDay);

            // Avança um dia para aplicar o fundo translúcido apenas nos blocos do meio
            current.setDate(current.getDate() + 1);

            while (current < targetEnd) {
                const yyyy = current.getFullYear();
                const mm = String(current.getMonth() + 1).padStart(2, '0');
                const dd = String(current.getDate()).padStart(2, '0');
                
                const middleDateString = `${yyyy}-${mm}-${dd}`;
                newMarked[middleDateString] = { color: ACCENT_RANGE_BG, textColor: DAY_TEXT };
                
                current.setDate(current.getDate() + 1);
            }

            // Aplica a marcação final de fechamento do período
            newMarked[end] = { endingDay: true, color: ACCENT_COLOR, textColor: DAY_TEXT };

            setStartDate(null); // Libera o estado temporário para a próxima seleção começar do zero
            setMarkedDates(newMarked);
            onRangeSelected(start, end);
        }
    };

    return (
        <View style={[styles.card, style]}>
            <Calendar
                markingType={'period'}
                markedDates={markedDates}
                onDayPress={handleDayPress}
                maxDate={new Date().toISOString().split('T')[0]}
                theme={{
                    calendarBackground: CALENDAR_BG,
                    monthTextColor: MONTH_TEXT,
                    textMonthFontSize: 14,
                    textMonthFontWeight: '600',
                    dayTextColor: DAY_TEXT,
                    textDayFontSize: 16,
                    textDayFontWeight: '600',
                    todayTextColor: ACCENT_COLOR,
                    textDisabledColor: '#6B6B6B',
                    textInactiveColor: '#6B6B6B',
                    textSectionTitleColor: HEADER_TEXT,
                    textDayHeaderFontSize: 10,
                    textDayHeaderFontWeight: '600',
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
        width: '100%',
    },
});

export default RangeCalendar;