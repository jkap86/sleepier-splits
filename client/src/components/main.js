import players from './player_ids.json';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import sleeperlogo from '../../src/images/sleeper_icon.png'
import headshot from '../images/headshot.png';
import FiltersModal from './filtersModal';
import Forms from './forms';

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
    const [category, setCategory] = useState('receiving');
    const [statistic, setStatistic] = useState('receiving_yards');
    const [top50Data, setTop50Data] = useState([]);

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
        setIsLoading(true)
        const topwr = await axios.get('/player/topwr', {
            params: {
                category: category,
                statistic: statistic,
                startSeason: startSeason,
                startWeek: startWeek,
                endSeason: endSeason,
                endWeek: endWeek
            }
        })
        setIsLoading(false)
        setTop50Data(topwr.data)
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
            keys_two = Object.keys(playerData2)
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
    console.log({ keys_two })

    const playerFound1 = players.find(p => p.gsis_id === playerData1.player_id)
    const playerFound2 = players.find(p => p.gsis_id === playerData2.player_id)

    return <div className='player-container'>
        <select className='nav' value={view} onChange={(e) => setView(e.target.value)}>
            <option>Player Comparison</option>
            <option>Top 50</option>
        </select>
        <div className="player-search">
            <h1>Sleepier Splits</h1>
            <Forms
                view={view}
                fetchPlayerStats={fetchPlayerStats}
                fetchTop50={fetchTop50}
                whichPlayer={whichPlayer}
                setWhichPlayer={setWhichPlayer}
                playerToSearch={playerToSearch}
                setPlayerToSearch={setPlayerToSearch}
                players={players}
                setDropdownVisible={setDropdownVisible}
                setFiltersModalVisible={setFiltersModalVisible}
                startSeason={startSeason}
                setStartSeason={setStartSeason}
                startWeek={startWeek}
                setStartWeek={setStartWeek}
                endSeason={endSeason}
                setEndSeason={setEndSeason}
                endWeek={endWeek}
                setEndWeek={setEndWeek}
                isLoading={isLoading}
                category={category}
                setCategory={setCategory}
                statistic={statistic}
                setStatistic={setStatistic}
            />

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
            view === 'Player Comparison'
                ? (dropdownVisible || (!playerFound1 && !playerFound2 && !isLoading))
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
                                                                        <td>{parseInt(playerData2[key.key]?.yards)?.toLocaleString("en-US")}</td>
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
                : view === 'Top 50'
                    ? (dropdownVisible || (!top50Data.length > 0 && !isLoading))
                        ? null
                        : isLoading
                            ? loadingIcon
                            : < div className='top50'>
                                <table>
                                    <thead>
                                        <tr>
                                            <th colSpan={2}>Rnk</th>
                                            <th colSpan={7}>Player</th>
                                            <th colSpan={2}>Tgts</th>
                                            <th colSpan={2}>Rec</th>
                                            <th colSpan={4}>Rec Yd</th>
                                            <th colSpan={2}>TDs</th>
                                            <th colSpan={3}>aDot</th>
                                            <th colSpan={3}>Tgt %</th>
                                            <th colSpan={3}>YPRR</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            top50Data
                                                .sort((a, b) => b[statistic] - a[statistic])
                                                .map((player, index) => {
                                                    const player_name = players.find(p => p.gsis_id === player.receiver_player_id)?.display_name
                                                    return <tr key={player.receiver_player_id}>
                                                        <td colSpan={2}>
                                                            {index + 1}
                                                        </td>
                                                        <td colSpan={7}>
                                                            {player_name}
                                                        </td>
                                                        <td colSpan={2}>
                                                            {player.targets}
                                                        </td>
                                                        <td colSpan={2}>
                                                            {player.complete_pass}
                                                        </td>
                                                        <td colSpan={4}>
                                                            {parseInt(player.receiving_yards)?.toLocaleString('en-US')}
                                                        </td>
                                                        <td colSpan={2}>
                                                            {player.touchdowns}
                                                        </td>
                                                        <td colSpan={3}>
                                                            {(parseInt(player.air_yards) / parseInt(player.targets)).toFixed(1)}
                                                        </td>
                                                        <td colSpan={3}>
                                                            {(parseInt(player.targets) / parseInt(player.routes)).toFixed(3)}
                                                        </td>
                                                        <td colSpan={3}>
                                                            {(parseInt(player.receiving_yards) / parseInt(player.routes)).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                })
                                        }
                                    </tbody>
                                </table>
                            </div>
                    : null
        }
    </div>
}

export default Main;