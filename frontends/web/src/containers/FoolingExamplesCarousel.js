import React from "react";
import { Carousel, Container } from "react-bootstrap";
import { FoolingExampleCard } from "./FoolingExampleCard.js";

class FoolingExamplesCarousel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      curIdx: 0,
    };
  }

  handleSelect = (selectedIndex) => {
    this.setState({
      currIdx: selectedIndex,
    });
  };

  render() {
    const exampleCards = this.props.examples.map((example) => (
      <Carousel.Item key={example.id}>
        <FoolingExampleCard example={example} task={this.props.task} />
      </Carousel.Item>
    ));
    return (
      <Carousel
        activeIndex={this.state.currIdx}
        interval={null}
        wrap={false}
        onSelect={this.handleSelect}
        className="px-3"
      >
        {exampleCards}
      </Carousel>
    );
  }
}

export { FoolingExamplesCarousel };
