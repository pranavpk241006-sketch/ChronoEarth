import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Atom, Bone, Check, Clock3, Compass, Globe2, Leaf, Menu, Search, Sparkles, X, Zap } from 'lucide-react'
import { creatures, periods } from './data.js'

const photos = {
  'Tyrannosaurus rex': { src: '/images/creatures/tyrannosaurus.jpg', alt: 'Sue, the Tyrannosaurus rex skeleton at the Field Museum in Chicago', source: 'https://commons.wikimedia.org/wiki/File:FMNH_SUE_Trex.jpg' },
  Triceratops: { src: '/images/creatures/triceratops.jpg', alt: 'Triceratops fossil skeleton displayed at Melbourne Museum', source: 'https://commons.wikimedia.org/wiki/File:2014_Triceratops_horridus_fossil.jpg' },
  Velociraptor: { src: '/images/creatures/velociraptor.jpg', alt: 'Fossil specimen assigned to Velociraptor at the Institute of Geology, Mongolia', source: 'https://commons.wikimedia.org/wiki/File:Velociraptor_specimen_IGM.jpg' },
  Mosasaurus: { src: '/images/creatures/mosasaurus.jpg', alt: 'Fossil skull of Mosasaurus hoffmanni', source: 'https://commons.wikimedia.org/wiki/File:Mosasaurus_hoffmanni_first_specimen.jpg' },
  Brachiosaurus: { src: '/images/creatures/brachiosaurus.jpg', alt: 'Mounted Brachiosaurus skeleton display inside the Field Museum', source: 'https://commons.wikimedia.org/wiki/File:Brachiosaurus_inside_Field_Museum.jpg' },
  Stegosaurus: { src: '/images/creatures/stegosaurus.jpg', alt: 'Mounted Stegosaurus ungulatus composite skeleton at Carnegie Museum of Natural History', source: 'https://commons.wikimedia.org/wiki/File:Stegosaurus_ungulatus.jpg' },
  Anomalocaris: { src: '/images/creatures/anomalocaris.jpg', alt: 'Fossil grasping appendage of Anomalocaris canadensis from the Burgess Shale', source: 'https://commons.wikimedia.org/wiki/File:Anomalocaris_canadensis_grasping_claw,_Burgess_Shale.jpg' },
  Trilobite: { src: '/images/creatures/trilobite.jpg', alt: 'Ogygopsis klotzi trilobite fossil from the Mt. Stephen beds', source: 'https://commons.wikimedia.org/wiki/File:Cambrian_Trilobite_Olenoides_Mt._Stephen.jpg' },
  'Woolly mammoth': { src: '/images/creatures/mammoth.jpg', alt: 'Mounted woolly mammoth skeleton at the Smithsonian National Museum of Natural History', source: 'https://commons.wikimedia.org/wiki/File:Woolly_mammoth_Smithsonian_National_Museum_of_Natural_History.jpg' },
  Archaeopteryx: { src: '/images/creatures/archaeopteryx.jpg', alt: 'The London specimen of Archaeopteryx preserved in limestone', source: 'https://commons.wikimedia.org/wiki/File:London_Archaeopteryx.jpg' },
}

const wikipediaPhotoCache = new Map()

function wikipediaArticleUrl(name) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/\s+/g, '_'))}`
}

function loadWikipediaPhoto(name) {
  if (!wikipediaPhotoCache.has(name)) {
    const title = encodeURIComponent(name.replace(/\s+/g, '_'))
    const photo = fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`)
      .then((response) => response.ok ? response.json() : null)
      .then((summary) => summary?.thumbnail?.source ? {
        src: summary.thumbnail.source,
        alt: summary.description ? `${summary.title}: ${summary.description}` : `${summary.title} from Wikipedia`,
      } : null)
      .catch(() => null)
    wikipediaPhotoCache.set(name, photo)
  }
  return wikipediaPhotoCache.get(name)
}

function shuffle(values) {
  const shuffled = [...new Set(values)]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function buildQuizQuestion(category, question, answer, alternatives, explanation) {
  const distractors = shuffle(alternatives.filter((option) => option !== answer)).slice(0, 3)
  const options = shuffle([answer, ...distractors])
  return { category, question, options, answer: options.indexOf(answer), explanation }
}

function createQuizQuestions() {
  const periodNames = periods.map((period) => period.name)
  const questions = [
    ...periods.slice(0, -1).map((period, index) => {
      const following = periods[index + 1]
      return buildQuizQuestion('Geological time', `Which interval followed the ${period.name}?`, following.name, periodNames, `${following.name} follows the ${period.name} in Earth's geological timeline.`)
    }),
    ...creatures.map((creature) => buildQuizQuestion('Creature records', `During which interval did ${creature.name} live?`, creature.period, periodNames, `${creature.name} is listed in the ${creature.period} collection.`)),
    ...periods.flatMap((period) => period.events.map((event) => buildQuizQuestion('Planetary shifts', `Which interval includes this event: ${event}`, period.name, periodNames, `This event is part of the ${period.name} record.`))),
    ...creatures.map((creature) => {
      const diet = creature.diet.toLowerCase()
      const article = /^[aeiou]/.test(diet) ? 'an' : 'a'
      return buildQuizQuestion('Animal adaptations', `Which species is ${article} ${diet}?`, creature.name, creatures.filter((other) => other.diet !== creature.diet).map((other) => other.name), `${creature.name} is classified as ${article} ${diet} in the Creature Vault.`)
    }),
    ...creatures.map((creature) => buildQuizQuestion('Ancient habitats', `Which species lived in ${creature.habitat}?`, creature.name, creatures.filter((other) => other.habitat !== creature.habitat).map((other) => other.name), `${creature.name} is associated with ${creature.habitat.toLowerCase()}.`)),
  ]
  const uniqueQuestions = [...new Map(questions.map((question) => [question.question, question])).values()]
  return shuffle(uniqueQuestions).slice(0, 8)
}

function Eyebrow({ children, icon: Icon = Sparkles }) { return <div className="eyebrow"><Icon size={13} /><span>{children}</span></div> }
function Intro({ eyebrow, title, description, icon }) { return <div className="page-intro"><Eyebrow icon={icon}>{eyebrow}</Eyebrow><h1>{title}</h1><p>{description}</p></div> }

function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setOpen(false), [location.pathname])
  return <header className="site-header"><div className="nav-shell"><Link className="brand" to="/"><span className="brand-mark"><Globe2 size={19} /></span><span>CHRONO<span>EARTH</span></span></Link><button className="menu-toggle icon-button" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open}><Menu size={19} /></button><nav className={`primary-nav ${open ? 'nav-open' : ''}`} aria-label="Main navigation"><NavLink to="/" end>Home</NavLink><NavLink to="/timeline">Timeline</NavLink><NavLink to="/creatures">Creatures</NavLink><NavLink to="/quiz">Quiz</NavLink><Link className="nav-start" to="/timeline">Begin journey <ArrowRight size={14} /></Link></nav></div></header>
}

function ImageWell({ creature, large = false }) {
  const wellRef = useRef(null)
  const [remoteResult, setRemoteResult] = useState(null)
  const [searchingName, setSearchingName] = useState(null)
  const [failedName, setFailedName] = useState(null)
  const localPhoto = photos[creature.name]
  const remotePhoto = remoteResult?.name === creature.name ? remoteResult.photo : null
  const photo = localPhoto || remotePhoto
  const broken = failedName === creature.name

  useEffect(() => {
    if (localPhoto) return undefined
    const node = wellRef.current
    if (!node) return undefined
    let active = true
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      setSearchingName(creature.name)
      loadWikipediaPhoto(creature.name).then((result) => {
        if (active) {
          setRemoteResult({ name: creature.name, photo: result })
          setSearchingName(null)
        }
      })
    }, { rootMargin: '220px' })
    observer.observe(node)
    return () => { active = false; observer.disconnect() }
  }, [creature.name, localPhoto])

  if (!photo || broken) return <div ref={wellRef} className={`image-well fossil-well ${large ? 'image-large' : ''}`}><Bone size={large ? 38 : 28} strokeWidth={1.2} /><span>{searchingName === creature.name ? 'SEARCHING WIKIPEDIA...' : remoteResult?.name === creature.name ? 'OPEN WIKIPEDIA ARTICLE' : `WIKIPEDIA IMAGE · ${creature.period.split(' ')[0]}`}</span></div>
  return <div className={`image-well ${large ? 'image-large' : ''}`}><img src={photo.src} alt={photo.alt} loading="lazy" onError={() => setFailedName(creature.name)} /><span className="photo-credit">{localPhoto ? 'SPECIMEN PHOTOGRAPH' : 'WIKIPEDIA ARTICLE IMAGE'}</span></div>
}

function Modal({ creature, onClose }) {
  const closeRef = useRef(null)
  useEffect(() => {
    if (!creature) return undefined
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener('keydown', onKey) }
  }, [creature, onClose])
  if (!creature) return null
  const photo = photos[creature.name] || { source: wikipediaArticleUrl(creature.name) }
  const sourceLabel = photos[creature.name] ? 'Photo source & license' : 'Wikipedia article & image source'
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="creature-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close icon-button" ref={closeRef} onClick={onClose} aria-label="Close details"><X size={18} /></button><ImageWell creature={creature} large /><div className="modal-copy"><Eyebrow icon={Bone}>Creature vault · {creature.period}</Eyebrow><h2 id="modal-title">{creature.name}</h2><div className="metadata-chips"><span>{creature.diet}</span><span>{creature.habitat}</span><span>{creature.type}</span></div><p>{creature.details}</p><a className="photo-source-link" href={photo.source} target="_blank" rel="noreferrer">{sourceLabel} <ArrowUpRight size={13} /></a><div className="modal-fact"><Sparkles size={15} />{creature.fact}</div><button className="button button-outline" onClick={onClose}>BACK TO THE VAULT <ArrowRight size={14} /></button></div></section></div>
}

function CreatureCard({ item, compact = false, onClick }) {
  const [modal, setModal] = useState(false)
  return <><button className={`creature-card ${compact ? 'card-compact' : ''}`} type="button" onClick={onClick || (() => setModal(true))}><ImageWell creature={item} /><span className="card-copy"><span className="card-period">{item.period}<ArrowUpRight size={12} /></span><strong>{item.name}</strong><span className="card-meta">{item.diet}<i />{item.habitat}</span><span className="card-fact">{item.fact}</span></span></button>{!onClick && <Modal creature={modal ? item : null} onClose={() => setModal(false)} />}</>
}

function Home() {
  const highlights = ['tyrannosaurus-rex', 'triceratops', 'anomalocaris'].map((id) => creatures.find((item) => item.id === id))
  return <>
    <section className="home-hero"><div className="hero-copy"><Eyebrow icon={Clock3}>A journey through deep time</Eyebrow><h1>CHRONO<span>EARTH</span></h1><p className="hero-lede">Earth wasn't always the world you know.</p><p className="hero-body">Travel through billions of years and discover the creatures and worlds that came before us.</p><div className="hero-actions"><Link className="button button-primary" to="/timeline">START TIME TRAVEL <ArrowRight size={16} /></Link><Link className="button button-quiet" to="/creatures">EXPLORE CREATURES <ArrowRight size={15} /></Link></div><div className="hero-note"><span className="live-dot" /> 4.5 BILLION YEARS <i /> 16 GEOLOGICAL CHAPTERS</div></div><div className="planet-stage" aria-label="Abstract CSS globe with orbit rings"><div className="orbit orbit-a" /><div className="orbit orbit-b" /><div className="orbit orbit-c" /><div className="planet-halo" /><div className="planet"><i className="land land-a" /><i className="land land-b" /><i className="land land-c" /><i className="planet-glint" /></div><span className="planet-pin pin-a" /><span className="planet-pin pin-b" /><div className="orbit-label label-age"><small>AGE OF EARTH</small><b>4.54 <i>BYA</i></b></div><div className="orbit-label label-now"><small>YOU ARE HERE</small><b>NOW <i>→</i></b></div><span className="coordinate">34° 09′ N<br />118° 19′ W</span><span className="planet-caption">ONE PLANET. DEEP TIME.</span></div></section>
    <section className="home-section"><div className="section-head"><div><Eyebrow icon={Clock3}>The long view</Eyebrow><h2>Time, in perspective.</h2></div><Link className="text-link" to="/timeline">Explore the timeline <ArrowRight size={15} /></Link></div><div className="preview-track">{periods.filter((_, index) => index % 2 === 0 || index === periods.length - 1).map((period, index) => <Link className={`preview-era era-${index % 4}`} to="/timeline" key={period.id}><span /><b>{period.name}</b><small>{period.date}</small></Link>)}</div><div className="track-labels"><span>4.5 BILLION YEARS AGO</span><span>TODAY</span></div></section>
    <section className="home-section"><div className="section-head"><div><Eyebrow icon={Bone}>Then & there</Eyebrow><h2>Meet the deep-time icons.</h2></div><Link className="text-link" to="/creatures">Open Creature Vault <ArrowRight size={15} /></Link></div><div className="featured-grid">{highlights.map((item) => <CreatureCard item={item} compact key={item.id} />)}</div></section>
    <section className="home-lower-grid"><div className="event-panel"><Eyebrow icon={Zap}>Turning points</Eyebrow><h2>Planet-sized plot twists.</h2><div className="event-list"><div><span>01</span><p><b>Oxygen transforms the air</b><small>Great Oxidation Event · 2.4 bya</small></p></div><div><span>02</span><p><b>Animal life diversifies</b><small>Cambrian explosion · 539 mya</small></p></div><div><span>03</span><p><b>An asteroid changes everything</b><small>K–Pg extinction · 66 mya</small></p></div></div></div><div className="fact-panel"><Eyebrow icon={Atom}>Small fact, big time</Eyebrow><div className="fact-index">01 <span>/ 03</span></div><p>All humans alive today share about <b>99.9% of their DNA</b>.</p><small>THE HOLOCENE · 11,700 YEARS TO NOW</small></div></section>
  </>
}

function Timeline() {
  const [selected, setSelected] = useState(periods[11])
  const [age, setAge] = useState(70)
  const navigate = useNavigate()
  const periodAt = (value) => periods.find((period) => value <= period.older && value >= period.younger) || periods.at(-1)
  const choose = (period) => { setSelected(period); setAge(Math.round((period.older + period.younger) / 2)) }
  const changeAge = (event) => { const next = Number(event.target.value); setAge(next); setSelected(periodAt(next)) }
  const ageLabel = age === 0 ? 'Present day' : age >= 1000 ? `${(age / 1000).toFixed(age % 1000 === 0 ? 0 : 1)} billion years ago` : `${Math.round(age)} million years ago`
  const matching = creatures.filter((item) => item.period === selected.name).slice(0, 5)
  const related = matching.length ? matching : creatures.filter((item) => item.period === 'Cenozoic Early Era').slice(0, 4)
  return <div className="timeline-page"><Intro eyebrow="The geological record" title="16 chapters. One restless planet." description="Choose a point in deep time. Each era reshapes the world, climate, and life that can survive." icon={Clock3} />
    <section className="selected-banner"><div className="selected-number">{String(periods.indexOf(selected) + 1).padStart(2, '0')}<i />16</div><div><Eyebrow icon={Compass}>Selected interval</Eyebrow><h2>{selected.name}</h2><p>{selected.fact}</p></div><div className="selected-date"><small>TIME WINDOW</small><b>{selected.date}</b><span>FEATURED LIFE · {selected.featured}</span></div></section>
    <section className="timeline-module"><div className="module-head"><div><span>01</span><h2>Walk the eras</h2></div><small>← SCROLL TO EXPLORE →</small></div><div className="timeline-scroll" tabIndex="0" aria-label="Scrollable geological timeline"><div className="timeline-line" />{periods.map((period, index) => <button type="button" className={`period-node node-${index % 5} ${period.id === selected.id ? 'period-selected' : ''}`} key={period.id} onClick={() => choose(period)} aria-pressed={period.id === selected.id}><span className="period-dot" /><small>{String(index + 1).padStart(2, '0')}</small><b>{period.name}</b><span className="period-date">{period.date}</span><span className="period-fact">{period.fact}</span><span className="period-creature">LIFE: {period.featured}</span></button>)}</div><div className="timeline-footer"><span>4.5 BYA</span><span>PHANEROZOIC EON</span><span>NOW</span></div></section>
    <section className="slider-panel"><div className="slider-head"><div><Eyebrow icon={Zap}>Time travel controls</Eyebrow><h2>Move through deep time</h2></div><div className="time-readout"><small>YOU ARE AT</small><b>{ageLabel}</b><span>{selected.name}</span></div></div><label className="visually-hidden" htmlFor="time-range">Select a time from 4.5 billion years ago to the present</label><input id="time-range" className="time-range" type="range" min="0" max="4500" step="1" value={age} onChange={changeAge} style={{ '--fill': `${((4500 - age) / 4500) * 100}%` }} /><div className="range-labels"><span>4.5 BILLION YEARS AGO</span><span>1 BILLION</span><span>100 MILLION</span><span>PRESENT</span></div><div className="slider-feature"><div><Bone size={18} /></div><p><small>IN THIS WORLD, YOU MIGHT FIND</small><b>{selected.featured}</b></p><Link className="text-link" to="/creatures">Meet the species <ArrowRight size={14} /></Link></div><div className="quick-jumps"><small>QUICK JUMPS</small><button onClick={() => { setAge(150); setSelected(periodAt(150)) }}>150 MYA <b>JURASSIC</b></button><button onClick={() => { setAge(70); setSelected(periodAt(70)) }}>70 MYA <b>CRETACEOUS</b></button><button onClick={() => { setAge(40); setSelected(periodAt(40)) }}>40 MYA <b>EARLY CENOZOIC</b></button></div></section>
    <section className="period-details"><div className="details-intro"><Eyebrow icon={Globe2}>Field notes · {selected.date}</Eyebrow><h2>{selected.name}<span> / EARTH AT THIS TIME</span></h2><p>{selected.summary}</p></div><div className="world-facts">{[['CLIMATE', selected.climate, Zap], ['ENVIRONMENT', selected.environment, Globe2], ['CONTINENTS', selected.continents, Compass], ['PLANT LIFE', selected.plants, Leaf]].map(([name, text, Icon]) => <div className="world-fact" key={name}><Icon size={15} /><small>{name}</small><p>{text}</p></div>)}</div><div className="details-section"><div className="section-head"><div><Eyebrow icon={Bone}>Life in this interval</Eyebrow><h3>Creatures of {selected.name}.</h3></div><span className="section-count">{related.length} FIELD RECORDS</span></div><div className="featured-grid detail-grid">{related.map((item) => <CreatureCard item={item} compact key={item.id} />)}</div></div><div className="details-two-col"><div className="details-section"><Eyebrow icon={Zap}>Planetary shifts</Eyebrow><h3>Major events</h3><div className="compact-events">{selected.events.map((event, index) => <div key={event}><span>0{index + 1}</span><p>{event}</p></div>)}</div></div><div className="details-section did-you-know"><Eyebrow icon={Sparkles}>Worth knowing</Eyebrow><h3>Did you know?</h3><ul>{selected.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul></div></div><div className="what-see"><span className="field-label">FIELD<br />VIEW</span><div><Eyebrow icon={Compass}>A moment inside deep time</Eyebrow><h3>What would you see?</h3><p>{selected.whatYouSee}</p></div><button className="text-link" onClick={() => navigate('/creatures')}>Explore life <ArrowRight size={14} /></button></div></section>
  </div>
}

function CreatureVault() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [active, setActive] = useState(null)
  const filters = ['All', 'Land', 'Marine', 'Flying', 'Carnivore', 'Herbivore']
  const shown = useMemo(() => creatures.filter((item) => `${item.name} ${item.period} ${item.habitat} ${item.fact}`.toLowerCase().includes(query.toLowerCase().trim()) && (filter === 'All' || item.type === filter || item.diet === filter)), [query, filter])
  return <div className="vault-page"><Intro eyebrow="The field collection" title="Creature Vault" description="Explore remarkable life forms that left their mark on the fossil record." icon={Bone} /><section className="vault-tools"><label className="search-box"><Search size={18} /><span className="visually-hidden">Search creatures</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a species, period, or habitat..." /></label><div className="filters" role="group" aria-label="Filter creatures">{filters.map((item) => <button className={filter === item ? 'filter-active' : ''} type="button" key={item} onClick={() => setFilter(item)} aria-pressed={filter === item}>{item}</button>)}</div><div className="result-count"><b>{String(shown.length).padStart(2, '0')}</b> SPECIMENS FOUND <i /> COLLECTION SIZE: {creatures.length}</div></section>{shown.length ? <div className="vault-grid">{shown.map((item) => <CreatureCard item={item} key={item.id} onClick={() => setActive(item)} />)}</div> : <div className="empty-state"><Search size={25} /><h2>No specimens match that search.</h2><p>Try another name or clear the active filters.</p><button className="button button-outline" onClick={() => { setQuery(''); setFilter('All') }}>CLEAR SEARCH <X size={14} /></button></div>}<Modal creature={active} onClose={() => setActive(null)} /></div>
}

function Quiz() {
  const [quizQuestions, setQuizQuestions] = useState(createQuizQuestions)
  const [number, setNumber] = useState(0)
  const [answer, setAnswer] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const current = quizQuestions[number]
  const pct = Math.round(score / quizQuestions.length * 100)
  const choose = (index) => { if (answer !== null) return; setAnswer(index); if (index === current.answer) setScore((value) => value + 1) }
  const next = () => { if (number === quizQuestions.length - 1) setDone(true); else { setNumber((value) => value + 1); setAnswer(null) } }
  const restart = () => { setQuizQuestions(createQuizQuestions()); setNumber(0); setAnswer(null); setScore(0); setDone(false) }
  return <div className="quiz-page"><Intro eyebrow="The knowledge station" title="Deep Time Quiz" description="Eight quick questions. No scoreboards, no pressure. Just you and 4.5 billion years of Earth history." icon={Sparkles} /><section className="quiz-console">{!done ? <><div className="quiz-top"><span>FIELD TEST <b>{String(number + 1).padStart(2, '0')}</b> / {String(quizQuestions.length).padStart(2, '0')}</span><span>SCORE <b>{score}</b></span></div><div className="quiz-progress" role="progressbar" aria-label="Quiz progress" aria-valuemin="0" aria-valuemax={quizQuestions.length} aria-valuenow={number + (answer === null ? 0 : 1)}><span style={{ width: `${(number + (answer === null ? 0 : 1)) / quizQuestions.length * 100}%` }} /></div><AnimatePresence mode="wait"><motion.div className="question-body" key={number} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}><small>{current.category}</small><h2>{current.question}</h2><div className="answer-list">{current.options.map((option, index) => <button type="button" disabled={answer !== null} key={option} onClick={() => choose(index)} className={`answer-option ${answer !== null && index === current.answer ? 'answer-correct' : ''} ${answer === index && index !== current.answer ? 'answer-wrong' : ''}`}><span>{String.fromCharCode(65 + index)}</span>{option}{answer !== null && index === current.answer && <Check size={16} />}{answer === index && index !== current.answer && <X size={16} />}</button>)}</div>{answer !== null && <div className={`feedback ${answer === current.answer ? 'feedback-good' : 'feedback-bad'}`} role="status"><b>{answer === current.answer ? 'Exactly right.' : 'Not quite.'}</b> {current.explanation}</div>}</motion.div></AnimatePresence><div className="quiz-bottom"><small>TAKE YOUR TIME · THIS IS A FIELD NOTE, NOT A TEST</small>{answer !== null && <button className="button button-primary" onClick={next}>{number === quizQuestions.length - 1 ? 'SEE YOUR RESULTS' : 'NEXT QUESTION'} <ArrowRight size={14} /></button>}</div></> : <div className="quiz-result"><div className="score-orbit"><b>{score}</b><span>/{quizQuestions.length}</span></div><Eyebrow icon={Sparkles}>Expedition complete</Eyebrow><h2>{pct >= 75 ? 'Excellent fieldwork.' : pct >= 50 ? 'A curious mind at work.' : 'Every explorer starts somewhere.'}</h2><p>You answered <b>{score} of {quizQuestions.length}</b> questions correctly. The fossil record still has plenty more to show you.</p><div className="result-meter"><span style={{ width: `${pct}%` }} /></div><div className="result-actions"><button className="button button-primary" onClick={restart}>PLAY AGAIN <Zap size={15} /></button><Link className="button button-quiet" to="/timeline">RETURN TO THE TIMELINE <ArrowRight size={14} /></Link></div></div>}</section>{!done && <div className="quiz-quote"><Atom size={19} /><p>“The present is the key to the past.”</p><small>JAMES HUTTON · GEOLOGIST</small></div>}</div>
}

function AppRoutes() {
  const location = useLocation()
  return <><Header /><main key={location.pathname} className="page-shell"><Routes><Route path="/" element={<Home />} /><Route path="/timeline" element={<Timeline />} /><Route path="/creatures" element={<CreatureVault />} /><Route path="/quiz" element={<Quiz />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></main><footer className="site-footer"><Link className="brand" to="/"><span className="brand-mark"><Globe2 size={17} /></span><span>CHRONO<span>EARTH</span></span></Link><span>A field guide to deep time</span><small>LOCAL DATA · BUILT FOR CURIOSITY</small></footer></>
}

export default function ChronoEarth() { return <BrowserRouter><AppRoutes /></BrowserRouter> }