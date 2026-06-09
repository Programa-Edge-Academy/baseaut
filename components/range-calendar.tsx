import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { DateData, MarkedDates } from 'react-native-calendars/src/types';

LocaleConfig.locales['pt-br'] = {
    monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

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
                [dateString]: { startingDay: true, color: '#2196F3', textColor: 'white' }
            };

            setMarkedDates(newMarked);
            onRangeSelected(dateString, null);
        }
        else {
            if (new Date(dateString) < new Date(startDate)) {
                setStartDate(dateString);
                setMarkedDates({
                    [dateString]: { startingDay: true, color: '#2196F3', textColor: 'white' }
                });
                onRangeSelected(dateString, null);
                return;
            }

            const newMarked: MarkedDates = {
                [startDate]: { startingDay: true, color: '#2196F3', textColor: 'white' }
            };

            let currentDate = new Date(startDate);
            const endDate = new Date(dateString);

            currentDate.setDate(currentDate.getDate() + 1);

            while (currentDate < endDate) {
                const middleDateString = currentDate.toISOString().split('T')[0];
                newMarked[middleDateString] = { color: '#BBDEFB', textColor: 'black' };
                currentDate.setDate(currentDate.getDate() + 1);
            }

            newMarked[dateString] = { endingDay: true, color: '#2196F3', textColor: 'white' };

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
                theme={{
                    todayTextColor: '#2196F3',
                    arrowColor: '#2196F3',
                    textDayFontFamily: 'System',
                    textMonthFontWeight: 'bold',
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        marginVertical: 10,
        overflow: 'hidden'
    }
});

export default RangeCalendar;