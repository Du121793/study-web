export default function Navs() {
  const classes = [
  ]
  return (
    <div>
      <ul className="navs">
        {classes.map((item, index) => (
          <li
            className="nav"
            key={index}>
            {item.name}
          </li>
        ))}
      </ul>
      <div className="horizontal-line"></div>
    </div>
  )
}
