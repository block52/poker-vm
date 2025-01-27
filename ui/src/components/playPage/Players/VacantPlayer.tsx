import * as React from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayerContext } from '../../../context/usePlayerContext';
import { PROXY_URL } from '../../../config/constants';
import axios from 'axios';
import { useAccount } from 'wagmi';

type VacantPlayerProps = {
    left?: string; // Front side image source
    top?: string; // Back side image source
    index: number;
};

const VacantPlayer: React.FC<VacantPlayerProps> = ({ left, top, index }) => {
    const navigate = useNavigate();
    const { address } = useAccount();
    const { id } = useParams<{ id: string }>();
    const { playerSeats } = usePlayerContext();

    const handleJoinTable = async () => {
        if (!address || !id) {
            console.error('No wallet connected or invalid table ID');
            return;
        }

        try {
            // Try to join the table
            const response = await axios.post(`${PROXY_URL}/table/${id}/join`, {
                address: address,
                seat: index,
            });

            if (response.status === 200) {
                console.log(`Successfully joined table at seat ${index}`);
            }
        } catch (error) {
            console.error('Error joining table:', error);
        }
    };

    return (
        <div
            key={index}
            className="absolute flex flex-col justify-center text-gray-600 w-[175px] h-[170px] mt-[40px] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{
                left: left,
                top: top,
                transition: "top 1s ease, left 1s ease"
            }}
            onClick={handleJoinTable}
        >
            <div className="flex justify-center gap-4 mb-2">
                <FaRegUserCircle color="#f0f0f0" className="w-10 h-10" />
            </div>
            <div className="text-white text-center">
                {playerSeats.includes(index) ? 'Seat Taken' : 'Click to Join'}
            </div>
        </div>
    );
};

export default VacantPlayer;
