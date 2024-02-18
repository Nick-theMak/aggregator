import Nav from 'react-bootstrap/Nav';
import { LinkContainer } from "react-router-bootstrap";

import './component.css'

const Tabs = () => {
  return (
    <Nav variant="pills" defaultActiveKey="/" className='justify-content-center my-4 nav-custom'>
      <LinkContainer to="/Aggregator">
        <Nav.Link className='nav-link-custom'>Aggregator</Nav.Link>
        </LinkContainer>
      <LinkContainer to="/">
        <Nav.Link className='nav-link-custom'>Swap</Nav.Link>
      </LinkContainer>
      <LinkContainer to="/deposit">
        <Nav.Link className='nav-link-custom'>Deposit</Nav.Link>
      </LinkContainer>
      <LinkContainer to="/withdraw">
        <Nav.Link className='nav-link-custom'>Withdraw</Nav.Link>
      </LinkContainer>
      <LinkContainer to="/charts">
        <Nav.Link className='nav-link-custom'>Charts</Nav.Link>
      </LinkContainer>
    </Nav>
  );
}

export default Tabs;
