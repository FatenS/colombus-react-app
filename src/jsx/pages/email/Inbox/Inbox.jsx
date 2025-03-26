import React, { useEffect, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  ListGroup, 
  Button, 
  Dropdown 
} from "react-bootstrap";

const Inbox = () => {
  // Default to a valid email type ("confirmation" or "interbank")
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [activeTab, setActiveTab] = useState("confirmation");

  useEffect(() => {
    fetchEmails();
  }, [activeTab]);

  const fetchEmails = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("No token found. Please login.");
      return;
    }
    try {
      // Use the full URL with /admin prefix and valid email type in the query
      const response = await fetch(
        `http://localhost:5001/admin/api/internal-emails?type=${activeTab}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setEmails(data);
      } else {
        console.error("Expected an array but got:", data);
        setEmails([]);
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
    }
  };

  return (
    <Fragment>
      <Container className="my-4">
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Body>
                <Row>
                  {/* Sidebar */}
                  <Col md={4} className="border-end">
                    <div className="mb-4 text-center">
                      <Link to="/email-compose" className="btn btn-primary">
                        Compose
                      </Link>
                    </div>
                    <ListGroup variant="flush">
                      <ListGroup.Item 
                        action 
                        active={activeTab === "confirmation"} 
                        onClick={() => setActiveTab("confirmation")}
                      >
                        <i className="fa fa-inbox me-2"></i>
                        Confirmation
                        <span className="badge bg-danger float-end">
                          {activeTab === "confirmation" ? emails.length : "-"}
                        </span>
                      </ListGroup.Item>
                      <ListGroup.Item 
                        action 
                        active={activeTab === "interbank"} 
                        onClick={() => setActiveTab("interbank")}
                      >
                        <i className="fa fa-bank me-2"></i>
                        Interbank
                        <span className="badge bg-info float-end">
                          {activeTab === "interbank" ? emails.length : "-"}
                        </span>
                      </ListGroup.Item>
                    </ListGroup>
                  </Col>

                  {/* Main Content */}
                  <Col md={8}>
                    {selectedEmail ? (
                      <Card className="mb-3">
                        <Card.Header as="h5">{selectedEmail.subject}</Card.Header>
                        <Card.Body>
                          <p>
                            <strong>From:</strong> {selectedEmail.sender}
                          </p>
                          <p>
                            <strong>To:</strong> {selectedEmail.recipient}
                          </p>
                          {selectedEmail.cc && (
                            <p>
                              <strong>CC:</strong> {selectedEmail.cc}
                            </p>
                          )}
                          <p>
                            <strong>Date:</strong> {selectedEmail.timestamp}
                          </p>
                          <hr />
                          <p>{selectedEmail.body}</p>
                        </Card.Body>
                        <Card.Footer>
                          <Button variant="secondary" onClick={() => setSelectedEmail(null)}>
                            Back to Inbox
                          </Button>
                        </Card.Footer>
                      </Card>
                    ) : (
                      <Card>
                        <Card.Header>
                          <Row className="align-items-center">
                            <Col>Inbox</Col>                         
                          </Row>
                        </Card.Header>
                        <Card.Body style={{ maxHeight: "400px", overflowY: "auto" }}>
                          {emails.length === 0 ? (
                            <p className="text-center text-muted">No emails available</p>
                          ) : (
                            emails.map((email) => (
                              <ListGroup key={email.id} variant="flush" className="mb-2">
                                <ListGroup.Item 
                                  action 
                                  onClick={() => setSelectedEmail(email)}
                                  className={email.is_read ? "" : "bg-light"}
                                >
                                  <Row>
                                    <Col xs={2}>
                                      <Button variant="link" className="p-0">
                                        <i className="fa fa-star"></i>
                                      </Button>
                                    </Col>
                                    <Col>
                                      <div className="fw-bold">{email.subject}</div>
                                      <div className="small text-muted">{email.timestamp}</div>
                                    </Col>
                                  </Row>
                                </ListGroup.Item>
                              </ListGroup>
                            ))
                          )}
                        </Card.Body>
                      </Card>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Fragment>
  );
};

export default Inbox;
