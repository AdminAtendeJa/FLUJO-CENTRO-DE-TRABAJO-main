import { useState } from 'react';

export const useSearch = () => {
    const [globalSearch, setGlobalSearch] = useState('');

    const handleSearchChange = (e) => {
        setGlobalSearch(e.target.value);
    };

    return {
        globalSearch,
        setGlobalSearch,
        handleSearchChange
    };
};