import Dropdown from './dropdown';
import { useEffect, forwardRef } from 'react';

const FiltersModal = forwardRef(({
    players,
    playerToInclude,
    setPlayerToInclude,
    playerToExclude,
    setPlayerToExclude,
    setFiltersModalVisible
}, ref) => {

    useEffect(() => {
        // Disable scroll when the component mounts
        document.body.style.overflow = 'hidden';

        // Enable scroll when the component unmounts
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);



    return <div className='filters-modal' ref={ref}>
        <i class="fa-solid fa-rectangle-xmark" onClick={() => setFiltersModalVisible(false)}></i>
        <div>
            <label>
                Include
                <Dropdown
                    searched={playerToInclude}
                    setSearched={setPlayerToInclude}
                    list={players}
                />
            </label>
            <label>
                Exclude
                <Dropdown
                    searched={playerToExclude}
                    setSearched={setPlayerToExclude}
                    list={players}
                />
            </label>
        </div>
    </div>
})

export default FiltersModal;