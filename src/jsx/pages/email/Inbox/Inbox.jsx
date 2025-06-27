// src/jsx/pages/email/Inbox.jsx            ← adjust the path to your tree
import React, { useEffect, useState, Fragment } from "react";
import { Container, Row, Col, Card, ListGroup, Button } from "react-bootstrap";
import axiosInstance from "../../../../services/AxiosInstance";   // ← NEW

export default function Inbox() {
  /* ------------------------------------------------------------- */
  /*                       LOCAL  STATE                            */
  /* ------------------------------------------------------------- */
  const [emails,        setEmails]        = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [activeTab,     setActiveTab]     = useState("confirmation"); // "confirmation" | "interbank"

  /* ------------------------------------------------------------- */
  /*                    FETCH  EMAILS  (on tab change)             */
  /* ------------------------------------------------------------- */
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const { data } = await axiosInstance.get(
          "/admin/api/internal-emails",
          { params: { type: activeTab } }
        );
        setEmails(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching emails:", err);
        setEmails([]);
      }
    };

    fetchEmails();
  }, [activeTab]);

  /* ============================================================= */
  /*                           RENDER                              */
  /* ============================================================= */
  return (
    <Fragment>
      <Container className="my-4">
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Body>
                <Row>
                  {/* ────────────  SIDEBAR  ──────────── */}
                  <Col md={4} className="border-end">
                    <ListGroup variant="flush">
                      <ListGroup.Item
                        action
                        active={activeTab === "confirmation"}
                        onClick={() => {
                          setSelectedEmail(null);
                          setActiveTab("confirmation");
                        }}
                      >
                        <i className="fa fa-inbox me-2" />
                        Confirmation
                        <span className="badge bg-danger float-end">
                          {activeTab === "confirmation" ? emails.length : "-"}
                        </span>
                      </ListGroup.Item>

                      <ListGroup.Item
                        action
                        active={activeTab === "interbank"}
                        onClick={() => {
                          setSelectedEmail(null);
                          setActiveTab("interbank");
                        }}
                      >
                        <i className="fa fa-bank me-2" />
                        Interbank
                        <span className="badge bg-info float-end">
                          {activeTab === "interbank" ? emails.length : "-"}
                        </span>
                      </ListGroup.Item>
                    </ListGroup>
                  </Col>

                  {/* ────────────  MAIN  PANE  ──────────── */}
                  <Col md={8}>
                    {/* Single-email view */}
                    {selectedEmail ? (
                      <Card className="mb-3">
                        <Card.Header as="h5">{selectedEmail.subject}</Card.Header>
                        <Card.Body>
                          <p><strong>From:</strong> {selectedEmail.sender}</p>
                          <p><strong>To:</strong> {selectedEmail.recipient}</p>
                          {selectedEmail.cc && (
                            <p><strong>CC:</strong> {selectedEmail.cc}</p>
                          )}
                          <p><strong>Date:</strong> {selectedEmail.timestamp}</p>
                          <hr />
                          <p style={{ whiteSpace: "pre-wrap" }}>{selectedEmail.body}</p>
                        </Card.Body>
                        <Card.Footer>
                          <Button
                            variant="secondary"
                            onClick={() => setSelectedEmail(null)}
                          >
                            Back to inbox
                          </Button>
                        </Card.Footer>
                      </Card>
                    ) : (
                      /* Inbox list */
                      <Card>
                        <Card.Header>Inbox</Card.Header>
                        <Card.Body style={{ maxHeight: 400, overflowY: "auto" }}>
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
                                      {/* placeholder for a star / flag */}
                                      <i className="fa fa-envelope-open-text text-secondary" />
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
}
