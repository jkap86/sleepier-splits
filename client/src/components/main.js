import players from './player_ids.json';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import Dropdown from './dropdown';
import sleeperlogo from '../../src/images/sleeper_icon.png'
import headshot from '../images/headshot.png';
import FiltersModal from './filtersModal';

const Main = () => {
    const [whichPlayer, setWhichPlayer] = useState('Player 1')
    const [playerToSearch, setPlayerToSearch] = useState('');
    const [playerToInclude, setPlayerToInclude] = useState('');
    const [playerToExclude, setPlayerToExclude] = useState('');
    const [playerData1, setPlayerData1] = useState({});
    const [playerData2, setPlayerData2] = useState({});
    const [startSeason, setStartSeason] = useState(2022);
    const [startWeek, setStartWeek] = useState(1);
    const [endSeason, setEndSeason] = useState(2022);
    const [endWeek, setEndWeek] = useState(18);
    const [breakoutby, setBreakoutby] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [filtersModalVisible, setFiltersModalVisible] = useState(false);
    const filtersModalRef = useRef();
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [view, setView] = useState('Player Comparison')

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

    console.log({ breakoutby })

    useEffect(() => {
        setPlayerToSearch('')
        setPlayerToInclude('')
        setPlayerToExclude('')
    }, [whichPlayer])

    useEffect(() => {
        setPlayerToInclude('')
        setPlayerToExclude('')
    }, [playerToSearch])

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
                    breakoutby: breakoutby === 'QB' ? 'passer_player_id' : breakoutby
                }
            })

            const data = {
                ...player.data,
                include: player_to_include?.display_name || '',
                exclude: player_to_exclude?.display_name || '',
                startSeason: startSeason,
                startWeek: startWeek,
                endSeason: endSeason,
                endWeek: endWeek,
                breakoutby: breakoutby === 'QB' ? 'passer_player_id' : breakoutby
            }

            if (whichPlayer === 'Player 1') {
                setPlayerData1(data)
            } else {
                setPlayerData2(data)
            }

            setIsLoading(false)
        }

    }

    const fetchTop50 = async (e) => {
        e.preventDefault();

        const topwr = await axios.get('/player/topwr', {
            params: {
                startSeason: startSeason,
                startWeek: startWeek,
                endSeason: endSeason,
                endWeek: endWeek
            }
        })

        console.log({ topwr: topwr.data })
    }

    let keys_one = [];

    switch (playerData1?.breakoutby) {
        case 'formation':
            keys_one = [
                { label: '2 WR', key: 'two_wr' },
                { label: '3 WR', key: 'three_wr' }
            ]
            break;
        case 'aDot':
            keys_one = [
                { label: 'Under 5 YD', key: 'yard_under_5' },
                { label: '5-9 YD', key: 'yard_5_9' },
                { label: '10-14 YD', key: 'yard_10_14' },
                { label: 'Over 15 YD', key: 'yard_over_15' }
            ]
            break;
        case 'season':
            keys_one = Object.keys(playerData1)
                .filter(key => key.startsWith('season_'))
                .map(key => {
                    return {
                        label: key.split('_')[1],
                        key: key
                    }
                })
            break;
        case 'passer_player_id':
            keys_one = Object.keys(playerData1)
                .filter(key => key.startsWith('passer_'))
                .map(key => {
                    return {
                        label: players.find(p => p.gsis_id === key.split('_')[1])?.display_name,
                        key: key
                    }
                })
        default:
            break;
    }

    let keys_two = [];

    switch (playerData2?.breakoutby) {
        case 'formation':
            keys_two = [
                { label: '2 WR', key: 'two_wr' },
                { label: '3 WR', key: 'three_wr' }
            ]
            break;
        case 'aDot':
            keys_two = [
                { label: 'Under 5 YD', key: 'yard_under_5' },
                { label: '5-9 YD', key: 'yard_5_9' },
                { label: '10-14 YD', key: 'yard_10_14' },
                { label: 'Over 15 YD', key: 'yard_over_15' }
            ]
            break;
        case 'season':
            keys_two = Object.keys(playerData2)
                .filter(key => key.startsWith('season_'))
                .map(key => {
                    return {
                        label: key.split('_')[1],
                        key: key
                    }
                })
            break;
        case 'passer_player_id':
            keys_one = Object.keys(playerData2)
                .filter(key => key.startsWith('passer_'))
                .map(key => {
                    return {
                        label: players.find(p => p.gsis_id === key.split('_')[1])?.display_name,
                        key: key
                    }
                })
        default:
            break;
    }

    const playerFound1 = players.find(p => p.gsis_id === playerData1.player_id)
    const playerFound2 = players.find(p => p.gsis_id === playerData2.player_id)

    return <div className='player-container'>
        <select className='nav' value={view} onChange={(e) => setView(e.target.value)}>
            <option>Player Comparison</option>
        </select>
        <div className="player-search">
            <h1>Sleepier Splits</h1>
            {
                view === 'Player Comparison'
                    ? <form onSubmit={(e) => fetchPlayerStats(e)}>

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
                    : view === 'Top 50'
                        ? <form onSubmit={(e) => fetchTop50(e)}>
                            <div>
                                <label>
                                    Category
                                    <select>
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
                        : null
            }
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
            (dropdownVisible || (!playerFound1 && !playerFound2 && !isLoading))
                ? null
                :
                <>
                    {
                        (playerFound1?.display_name || (whichPlayer === 'Player 1' && isLoading))
                            ? <div className='player-card one'>
                                {
                                    (whichPlayer === 'Player 1' && isLoading)
                                        ? loadingIcon
                                        : <>
                                            <h1>
                                                {
                                                    playerFound1
                                                    && <img
                                                        alt='headshot'
                                                        src={playerFound1?.headshot || headshot}
                                                    />
                                                }
                                                {playerFound1?.display_name}
                                            </h1>
                                            <h3>
                                                <span>
                                                    {playerData1.startSeason && (playerData1.startSeason + ' Week ' + playerData1.startWeek)}&nbsp;
                                                    -&nbsp;
                                                    {playerData1.endSeason + ' Week ' + playerData1.endWeek}
                                                </span>
                                            </h3>
                                            <h3>
                                                <span>
                                                    {playerData1.include !== '' && 'With: ' + playerData1.include}
                                                    {playerData1.exclude !== '' && 'Without: ' + playerData1.exclude}
                                                </span>
                                            </h3>
                                            <h2>
                                                <table>
                                                    <caption>TOTALS</caption>
                                                    <tbody>
                                                        <tr>
                                                            <th>Games</th>
                                                            <td>{playerData1.games}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Plays</th>
                                                            <td>{playerData1.plays}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Targets</th>
                                                            <td>{playerData1.targets}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Rec</th>
                                                            <td>{playerData1.rec}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>yards</th>
                                                            <td>{parseInt(playerData1.yards)?.toLocaleString("en-US")}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>tds</th>
                                                            <td>{playerData1.tds}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Tgt Share</th>
                                                            <td>{playerData1.tgt_share && parseFloat(playerData1.tgt_share)?.toLocaleString("en-US", { maximumFractionDigits: 3 })}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>aDot</th>
                                                            <td>{playerData1.aDot && parseFloat(playerData1.aDot)?.toLocaleString("en-US", { maximumFractionDigits: 1 })}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>YPRR</th>
                                                            <td>{playerData1.yprr && parseFloat(playerData1.yprr)?.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                {
                                                    keys_one.map(key => {
                                                        return <table>
                                                            <caption>{key.label}</caption>
                                                            <tbody>
                                                                <tr>
                                                                    <th>Games</th>
                                                                    <td>{playerData1[key.key]?.games}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>Plays</th>
                                                                    <td>{playerData1[key.key]?.plays}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>Targets</th>
                                                                    <td>{playerData1[key.key]?.targets}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>Rec</th>
                                                                    <td>{playerData1[key.key]?.rec}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>yards</th>
                                                                    <td>{parseInt(playerData1[key.key]?.yards)?.toLocaleString("en-US")}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>tds</th>
                                                                    <td>{playerData1[key.key]?.tds}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>Tgt Share</th>
                                                                    <td>{playerData1[key.key]?.tgt_share && parseFloat(playerData1[key.key]?.tgt_share)?.toLocaleString("en-US", { maximumFractionDigits: 3 })}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>aDot</th>
                                                                    <td>{playerData1[key.key]?.aDot && parseFloat(playerData1[key.key]?.aDot)?.toLocaleString("en-US", { maximumFractionDigits: 1 })}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>YPRR</th>
                                                                    <td>{playerData1[key.key]?.yprr && parseFloat(playerData1[key.key]?.yprr)?.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    })

                                                }

                                            </h2>
                                        </>
                                }
                            </div>
                            : null
                    }
                    {
                        (playerFound2?.display_name || (whichPlayer === 'Player 2' && isLoading))
                            ? <div
                                className='player-card two'
                            >
                                {
                                    (whichPlayer === 'Player 2' && isLoading)
                                        ? loadingIcon
                                        : <>
                                            <h1>
                                                {
                                                    playerFound2
                                                    && <img
                                                        alt='headshot'
                                                        src={playerFound2?.headshot || headshot}
                                                    />
                                                }
                                                {playerFound2?.display_name}
                                            </h1>
                                            <h3>
                                                <span>
                                                    {playerData2.startSeason && (playerData2.startSeason + ' Week ' + playerData2.startWeek)}&nbsp;
                                                    -&nbsp;
                                                    {playerData2.endSeason + ' Week ' + playerData2.endWeek}
                                                </span>
                                            </h3>
                                            <h3>
                                                <span>
                                                    {playerData2.include !== '' && 'With: ' + playerData2.include}
                                                    {playerData2.exclude !== '' && 'Without: ' + playerData2.exclude}
                                                </span>
                                            </h3>
                                            <h2>
                                                <table>
                                                    <caption>TOTALS</caption>
                                                    <tbody>
                                                        <tr>
                                                            <th>Games</th>
                                                            <td>{playerData2.games}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Plays</th>
                                                            <td>{playerData2.plays}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Targets</th>
                                                            <td>{playerData2.targets}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Rec</th>
                                                            <td>{playerData2.rec}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>yards</th>
                                                            <td>{parseInt(playerData2.yards)?.toLocaleString("en-US")}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>tds</th>
                                                            <td>{playerData2.tds}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Tgt Share</th>
                                                            <td>{playerData2.tgt_share && parseFloat(playerData2.tgt_share)?.toLocaleString("en-US", { maximumFractionDigits: 3 })}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>aDot</th>
                                                            <td>{playerData2.aDot && parseFloat(playerData2.aDot)?.toLocaleString("en-US", { maximumFractionDigits: 1 })}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>YPRR</th>
                                                            <td>{playerData2.yprr && parseFloat(playerData2.yprr)?.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                {
                                                    keys_two.map(key => {
                                                        return <table>
                                                            <caption>{key.label}</caption>
                                                            <tbody>
                                                                <tr>
                                                                    <th>Games</th>
                                                                    <td>{playerData2[key.key]?.games}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>Plays</th>
                                                                    <td>{playerData2[key.key]?.plays}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>Targets</th>
                                                                    <td>{playerData2[key.key]?.targets}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>Rec</th>
                                                                    <td>{playerData2[key.key]?.rec}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>yards</th>
                                                                    <td>{parseInt(playerData2[key.key])?.yards?.toLocaleString("en-US")}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>tds</th>
                                                                    <td>{playerData2[key.key]?.tds}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>Tgt Share</th>
                                                                    <td>{playerData2[key.key]?.tgt_share && parseFloat(playerData2[key.key]?.tgt_share)?.toLocaleString("en-US", { maximumFractionDigits: 3 })}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>aDot</th>
                                                                    <td>{playerData2[key.key]?.aDot && parseFloat(playerData2[key.key]?.aDot)?.toLocaleString("en-US", { maximumFractionDigits: 1 })}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>YPRR</th>
                                                                    <td>{playerData2[key.key]?.yprr && parseFloat(playerData2[key.key]?.yprr)?.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    })

                                                }

                                            </h2>
                                        </>
                                }
                            </div>
                            : null
                    }
                </>
        }
    </div>
}

export default Main;