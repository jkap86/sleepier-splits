import Dropdown from './dropdown';

const Forms = ({
    view,
    fetchPlayerStats,
    fetchTop50,
    whichPlayer,
    setWhichPlayer,
    playerToSearch,
    setPlayerToSearch,
    players,
    setDropdownVisible,
    setFiltersModalVisible,
    startSeason,
    setStartSeason,
    startWeek,
    setStartWeek,
    endSeason,
    setEndSeason,
    endWeek,
    setEndWeek,
    isLoading,
    category,
    setCategory,
    statistic,
    setStatistic,
}) => {


    let form;

    switch (view) {
        case 'Player Comparison':
            form = <form onSubmit={(e) => fetchPlayerStats(e)}>
                <div>
                    <label>
                        <span onClick={() => setWhichPlayer(prevState => prevState === 'Player 1' ? 'Player 2' : 'Player 1')}>{whichPlayer}</span>
                        <Dropdown
                            searched={playerToSearch}
                            setSearched={setPlayerToSearch}
                            list={players}
                            sendDropdownVisible={(data) => setDropdownVisible(data)}
                        />
                        <i onClick={() => setFiltersModalVisible(true)} className="fa-solid fa-filter"></i>
                    </label>
                </div>
                <div className='range-container'>
                    <div className='range'>
                        <label>
                            FROM
                            <div>
                                <select value={startSeason} onChange={(e) => setStartSeason(e.target.value)}>
                                    <option>2022</option>
                                    <option>2021</option>
                                    <option>2020</option>
                                    <option>2019</option>
                                    <option>2018</option>
                                    <option>2017</option>
                                    <option>2016</option>
                                </select>
                                <em>Week</em>
                                <select value={startWeek} onChange={(e) => setStartWeek(e.target.value)}>
                                    {
                                        Array.from(Array(18).keys()).map(key => {
                                            return <option key={key + 1}>
                                                {key + 1}
                                            </option>
                                        })
                                    }
                                </select>
                            </div>
                        </label>
                    </div>
                    <div className='range'>
                        <label>
                            TO
                            <div>
                                <select value={endSeason} onChange={(e) => setEndSeason(e.target.value)}>
                                    <option>2022</option>
                                    <option>2021</option>
                                    <option>2020</option>
                                    <option>2019</option>
                                    <option>2018</option>
                                    <option>2017</option>
                                    <option>2016</option>
                                </select>
                                <em>Week</em>
                                <select value={endWeek} onChange={(e) => setEndWeek(e.target.value)}>
                                    {
                                        Array.from(Array(18).keys()).map(key => {
                                            return <option key={key + 1}>
                                                {key + 1}
                                            </option>
                                        })
                                    }
                                </select>
                            </div>
                        </label>
                    </div>
                </div>
                <button type="submit" disabled={isLoading}>Submit</button>
            </form>
            break;
        case 'Top 50':
            form = <form onSubmit={(e) => fetchTop50(e)}>
                <div>
                    <label>
                        Category
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option>receiving</option>
                        </select>
                    </label>
                    <label>
                        Statistic
                        <select value={statistic} onChange={(e) => setStatistic(e.target.value)}>
                            <option value={'receiving_yards'}>receiving yards</option>
                        </select>
                    </label>
                </div>
                <div className='range-container'>
                    <div className='range'>
                        <label>
                            FROM
                            <div>
                                <select value={startSeason} onChange={(e) => setStartSeason(e.target.value)}>
                                    <option>2022</option>
                                    <option>2021</option>
                                    <option>2020</option>
                                    <option>2019</option>
                                    <option>2018</option>
                                    <option>2017</option>
                                    <option>2016</option>
                                </select>
                                <em>Week</em>
                                <select value={startWeek} onChange={(e) => setStartWeek(e.target.value)}>
                                    {
                                        Array.from(Array(18).keys()).map(key => {
                                            return <option key={key + 1}>
                                                {key + 1}
                                            </option>
                                        })
                                    }
                                </select>
                            </div>
                        </label>
                    </div>
                    <div className='range'>
                        <label>
                            TO
                            <div>
                                <select value={endSeason} onChange={(e) => setEndSeason(e.target.value)}>
                                    <option>2022</option>
                                    <option>2021</option>
                                    <option>2020</option>
                                    <option>2019</option>
                                    <option>2018</option>
                                    <option>2017</option>
                                    <option>2016</option>
                                </select>
                                <em>Week</em>
                                <select value={endWeek} onChange={(e) => setEndWeek(e.target.value)}>
                                    {
                                        Array.from(Array(18).keys()).map(key => {
                                            return <option key={key + 1}>
                                                {key + 1}
                                            </option>
                                        })
                                    }
                                </select>
                            </div>
                        </label>
                    </div>
                </div>
                <button type="submit" disabled={isLoading}>Submit</button>
            </form>
            break;
        default:
            break;
    }

    return form
}

export default Forms;