/**
 * Creates the Half component (meaning "half" of a match, a single letter or
 * word or sound)
 */

import React, {Component} from "react";
import {
    Animated,
    Easing,
    View,
    Text,
    PanResponder,
    Dimensions,
    StyleSheet
} from "react-native";

class Half extends Component {
    constructor(props) {
        super(props);
        this.state = {
            top: props.obj.pos[1],
            left: props.obj.pos[0],
            isBeingDragged: false,
            scale: new Animated.Value(1.00)
        };
        this.size = Dimensions.get("window").height * this.props.fractionOfHeight / 4;
        this.originalLeft = this.props.obj.pos[0];
        this.originalTop = this.props.obj.pos[1];
        let onPanResponderEnd = () => {
            let overlap = this.props.getOverlappingID();
            if (overlap) {
                if (this.props.obj.pair_id.includes(overlap)) {
                    // match!
                    this.setState({
                        isBeingDragged: false
                    });
                    this.props.right({left: this.state.left, top: this.state.top});
                } else {
                    // wrong!
                    this.props.wrong();
                    this.setState({
                        isBeingDragged: false,
                        top: this.originalTop,
                        left: this.originalLeft
                    });
                }
            } else {
                this.setState({
                    isBeingDragged: false,
                    top: this.originalTop,
                    left: this.originalLeft
                });
            }
            this.props.doneBeingDragged();
        }
        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                this.props.playSound(this.props.obj.target);
                this.setState({isBeingDragged: true});
                this.props.beingDragged(
                    this.props.obj.object_id,
                    this.props.obj.target,
                    {top: this.state.top, left: this.state.left}
                );
            },
            onPanResponderMove: (evt, gestureState) => {
                let {dx, dy} = gestureState;
                let {width, height} = Dimensions.get("window");
                var newTop = this.originalTop + dy;
                var newLeft = this.originalLeft + dx;
                if (!(newTop < (height - this.size) && newTop >= 0)) {
                    // newTop is outside of screen, so don't change current top
                    newTop = this.state.top;
                }
                if (!(newLeft < (width - this.size) && newLeft >= 0)) {
                    // newLeft is outside of screen, so don't change current left
                    newLeft = this.state.left;
                }
                this.setState({
                    left: newLeft,
                    top: newTop
                });
                this.props.beingDragged(
                    this.props.obj.object_id,
                    this.props.obj.target,
                    {top: newTop, left: newLeft}
                );
            },
            onPanResponderRelease: onPanResponderEnd,
            onPanResponderTerminate: onPanResponderEnd
        });
    }

    giveHint() {
        this.pulse = Animated.sequence([
            Animated.timing(this.state.scale, {
                toValue: 1.5,
                duration: 1000,
                easing: Easing.linear
            }),
            Animated.timing(this.state.scale, {
                toValue: 1.00,
                duration: 1000,
                easing: Easing.linear
            })
        ]);
        this.pulse.start(() => this.giveHint());
    }

    componentDidMount() {
        console.log("did mount");
        if (this.props.shouldGiveHint(this.props.obj.pair_id)) {
            console.log("yes");
            this.giveHint();
        }
    }

    makeStyles(isOverlapped) {
        let backgroundOpacity = 0.30 * this.props.currentOpacity;
        let objOpacity = this.props.currentOpacity;
        if (this.props.currentOpacity == 1) {
            if (isOverlapped) {
                backgroundOpacity = 1.00;
            } else if (this.state.isBeingDragged) {
                backgroundOpacity = 0.70;
            }
        }
        return StyleSheet.create({
            container: {
                position: "absolute",
                top: this.state.top,
                left: this.state.left
            },
            background: {
                position: "absolute",
                top: 10,
                left: -10,
                width: this.size * this.state.scale._value,
                height: this.size * this.state.scale._value,
                transform: [{scale: this.state.scale._value}],
                backgroundColor: "white",
                borderRadius: this.size / 2,
                opacity: backgroundOpacity
            },
            obj: {
                position: "absolute",
                color: "black",
                fontSize: this.size * this.state.scale._value,
                transform: [{scale: this.state.scale._value}],
                opacity: objOpacity
            }
        });
    }

    render() {
        this.possibleOverlap = this.props.possibleOverlap();
        let otherHalf = this.possibleOverlap.next().value;
        if (otherHalf) {
            // there is a Half from the other side being dragged, check the
            // distance between it and this Half
            let l1 = this.state.left,
                t1 = this.state.top,
                l2 = otherHalf.location.left,
                t2 = otherHalf.location.top;
            let distance = Math.sqrt((l2 - l1)*(l2 - l1) + (t2 - t1)*(t2 - t1));
            if (distance < this.size) {
                var isOverlapped = true;
            }
            // also check if should provie pulse
            //if (this.props.obj.pair_id.indexOf(otherHalf.id) >= 0) {
            if (this.props.shouldGiveHint(this.props.obj.pair_id)) {
                this.giveHint();
            }
            this.possibleOverlap.next({
                isOverlap: isOverlapped,
                object_id: this.props.obj.object_id
            });
        }
        let styles = this.makeStyles(isOverlapped);
        return (
            <View style={styles.container} {...this.panResponder.panHandlers}>
                <Animated.View style={styles.background} />
                <Animated.Text style={styles.obj}>
                    {this.props.obj.target}
                </Animated.Text>
            </View>
        );
    }
}

export default Half;
