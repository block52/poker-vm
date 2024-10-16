import React, { useState, useEffect } from 'react';
import { Box, Text, VStack, HStack } from '@chakra-ui/react';
import { JSX } from 'react/jsx-runtime';

interface CountdownTimerProps {
    targetDate: Date;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = +targetDate - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return timeLeft;
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    const timerComponents: JSX.Element[] = [];

    Object.keys(timeLeft).forEach((interval) => {
        if (!timeLeft[interval as keyof typeof timeLeft]) {
            return;
        }

        timerComponents.push(
            <Box key={interval} textAlign="center" p={2}>
                <Text fontSize="2xl" fontWeight="bold">
                    {timeLeft[interval as keyof typeof timeLeft]}
                </Text>
                <Text fontSize="sm">{interval}</Text>
            </Box>
        );
    });

    return (
        <VStack>
            <Text fontSize="xl" fontWeight="bold" mb={2}>
                Countdown to the Retreat
            </Text>
            <HStack spacing={4}>
                {timerComponents.length ? timerComponents : <Text>The retreat has started!</Text>}
            </HStack>
        </VStack>
    );
};
export default CountdownTimer;