import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

class ModalComplete extends React.Component {
  render() {
    const { currentStory, modalComplete, resetTour, endTour } = this.props;
    const readMoreLinks = currentStory.readMoreLinks;
    let list;
    if (
      readMoreLinks &&
      (Array.isArray(readMoreLinks) && readMoreLinks.length)
    ) {
      list = (
        <React.Fragment>
          <p>Read more about this story at the links below:</p>
          <ul>
            {readMoreLinks.map((linkId, i) => (
              <li key={i} index={i}>
                <a href={linkId.link} target="_blank" rel="noopener noreferrer">
                  {linkId.title}
                </a>
              </li>
            ))}
          </ul>
        </React.Fragment>
      );
    }
    return (
      <div>
        <Modal
          isOpen={modalComplete}
          toggle={endTour}
          wrapClassName="tour tour-complete"
          backdrop={'static'}
          fade={false}
          keyboard={true}
        >
          <ModalHeader toggle={endTour} charCode="">
            Story Complete
          </ModalHeader>
          <ModalBody>
            <p>
              You have now completed a story in Worldview. To view more stories,
              click the &ldquo;More Stories&rdquo; button below to explore more events
              within the app. Click the &ldquo;Exit Tutorial&rdquo; button or close this
              window to start using Worldview on your own.
            </p>
            {list}
          </ModalBody>
          <ModalFooter>
            <button
              type="button"
              className="btn btn-primary"
              onClick={resetTour}
            >
              More Stories
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={endTour}
            >
              Exit Tutorial
            </button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

ModalComplete.propTypes = {
  currentStory: PropTypes.object.isRequired,
  endTour: PropTypes.func.isRequired,
  modalComplete: PropTypes.bool.isRequired,
  resetTour: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default ModalComplete;
