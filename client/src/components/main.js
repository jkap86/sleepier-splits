import players from './player_ids.json';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import Dropdown from './dropdown';
import sleeperlogo from '../../src/images/sleeper_icon.png'
import headshot from '../images/headshot.png';
import FiltersModal from './filtersModal';

const Main = () => {
    const [playerToSearch, setPlayerToSearch] = useState('');
    const [playerToInclude, setPlayerToInclude] = useState('');
    const [playerToExclude, setPlayerToExclude] = useState('');
    const [playerData, setPlayerData] = useState({});
    const [startSeason, setStartSeason] = useState(2022);
    const [startWeek, setStartWeek] = useState(1);
    const [endSeason, setEndSeason] = useState(2022);
    const [endWeek, setEndWeek] = useState(18);
    const [breakoutby, setBreakoutby] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [filtersModalVisible, setFiltersModalVisible] = useState(false);
    const filtersModalRef = useRef();
    const [dropdownVisible, setDropdownVisible] = useState(false);

    useEffect(() => {
        const handleExitTooltip = (event) => {

            if (!filtersModalRef.current || !filtersModalRef.current.contains(event.target)) {

                setFiltersModalVisible(false);
            }
        };

        document.addEventListener('mousedown', handleExitTooltip);

        return () => {
            document.removeEventListener('mousedown', handleExitTooltip);
        }

    }, [])

    const loadingIcon = (
        <div className='loading'>
            <img
                className="loading"
                src={sleeperlogo}
                alt={'logo'}
            />
            <div className='z_one'>
                Z
            </div>
            <div className='z_two'>
                Z
            </div>
            <div className='z_three'>
                Z
            </div>
        </div>
    )

    const fetchPlayerStats = async (e) => {
        e.preventDefault();
        const player_to_find = players.find(p => p.display_name === playerToSearch?.display_name);

        const player_to_include = players.find(p => p.display_name === playerToInclude?.display_name);
        const player_to_exclude = players.find(p => p.display_name === playerToExclude?.display_name);

        if (player_to_find) {
            setIsLoading(true)

            const player = await axios.get('/player/wrsummary', {
                params: {
                    player_id: player_to_find.gsis_id,
                    include: player_to_include?.gsis_id || 0,
                    exclude: player_to_exclude?.gsis_id || 0,
                    startSeason: startSeason,
                    startWeek: startWeek,
                    endSeason: endSeason,
                    endWeek: endWeek,
                    breakoutby: breakoutby
                }
            })

            console.log(player.data)

            setPlayerData(player.data)

            setIsLoading(false)
        }

    }

    let keys = [];

    switch (breakoutby) {
        case 'Formation':
            keys = [
                { label: '2 WR', key: 'two_wr' },
                { label: '3 WR', key: 'three_wr' }
            ]
            break;
        case 'aDot':
            keys = [
                { label: 'Under 5 YD', key: 'yard_under_5' },
                { label: '5-9 YD', key: 'yard_5_9' },
                { label: '10-14 YD', key: 'yard_10_14' },
                { label: 'Over 15 YD', key: 'yard_over_15' }
            ]
            break;
        default:
            break;
    }

    const playerFound = players.find(p => p.gsis_id === playerData.player_id)

    return <div className='player-container'>
        <div className="player-search">
            <h1>Sleepier Splits</h1>
            <form onSubmit={(e) => fetchPlayerStats(e)}>

                <div>
                    <label>
                        Player
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
        </div>
        {
            filtersModalVisible ?
                <FiltersModal
                    players={players}
                    playerToInclude={playerToInclude}
                    setPlayerToInclude={setPlayerToInclude}
                    playerToExclude={playerToExclude}
                    setPlayerToExclude={setPlayerToExclude}
                    setFiltersModalVisible={setFiltersModalVisible}
                    breakoutby={breakoutby}
                    setBreakoutby={setBreakoutby}
                    ref={filtersModalRef}
                />
                : null
        }
        {
            isLoading
                ? loadingIcon
                : (dropdownVisible || !playerFound)
                    ? null
                    : <div className='player-card'>
                        <h1>
                            {
                                playerFound
                                && <img
                                    alt='headshot'
                                    src={playerFound?.headshot || headshot}
                                />
                            }
                            {playerFound?.display_name}
                        </h1>
                        <h3>
                            <span>College: {playerFound?.college_name || '-'}</span>

                            <span>Birthdate: {playerFound?.birth_date || '-'}</span>

                            <span>Rookie Year: {playerFound?.rookie_year || '-'}</span >
                        </h3>
                        <h2>
                            <table>
                                <caption>TOTALS</caption>
                                <tbody>
                                    <tr>
                                        <th>Games</th>
                                        <td>{playerData.games}</td>
                                    </tr>
                                    <tr>
                                        <th>Plays</th>
                                        <td>{playerData.plays}</td>
                                    </tr>
                                    <tr>
                                        <th>Targets</th>
                                        <td>{playerData.targets}</td>
                                    </tr>
                                    <tr>
                                        <th>Rec</th>
                                        <td>{playerData.rec}</td>
                                    </tr>
                                    <tr>
                                        <th>yards</th>
                                        <td>{playerData.yards}</td>
                                    </tr>
                                    <tr>
                                        <th>tds</th>
                                        <td>{playerData.tds}</td>
                                    </tr>
                                    <tr>
                                        <th>Tgt Share</th>
                                        <td>{playerData.tgt_share && parseFloat(playerData.tgt_share)?.toLocaleString("en-US", { maximumFractionDigits: 3 })}</td>
                                    </tr>
                                    <tr>
                                        <th>aDot</th>
                                        <td>{playerData.aDot && parseFloat(playerData.aDot)?.toLocaleString("en-US", { maximumFractionDigits: 1 })}</td>
                                    </tr>
                                    <tr>
                                        <th>YPRR</th>
                                        <td>{playerData.yprr && parseFloat(playerData.yprr)?.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                                    </tr>
                                </tbody>
                            </table>
                            {
                                keys.map(key => {
                                    return <table>
                                        <caption>{key.label}</caption>
                                        <tbody>
                                            <tr>
                                                <th>Games</th>
                                                <td>{playerData[key.key]?.games}</td>
                                            </tr>
                                            <tr>
                                                <th>Plays</th>
                                                <td>{playerData[key.key]?.plays}</td>
                                            </tr>
                                            <tr>
                                                <th>Targets</th>
                                                <td>{playerData[key.key]?.targets}</td>
                                            </tr>
                                            <tr>
                                                <th>Rec</th>
                                                <td>{playerData[key.key]?.rec}</td>
                                            </tr>
                                            <tr>
                                                <th>yards</th>
                                                <td>{playerData[key.key]?.yards}</td>
                                            </tr>
                                            <tr>
                                                <th>tds</th>
                                                <td>{playerData[key.key]?.tds}</td>
                                            </tr>
                                            <tr>
                                                <th>Tgt Share</th>
                                                <td>{playerData[key.key]?.tgt_share && parseFloat(playerData[key.key]?.tgt_share)?.toLocaleString("en-US", { maximumFractionDigits: 3 })}</td>
                                            </tr>
                                            <tr>
                                                <th>aDot</th>
                                                <td>{playerData[key.key]?.aDot && parseFloat(playerData[key.key]?.aDot)?.toLocaleString("en-US", { maximumFractionDigits: 1 })}</td>
                                            </tr>
                                            <tr>
                                                <th>YPRR</th>
                                                <td>{playerData[key.key]?.yprr && parseFloat(playerData[key.key]?.yprr)?.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                })

                            }

                        </h2>
                    </div>
        }
    </div>
}

export default Main;