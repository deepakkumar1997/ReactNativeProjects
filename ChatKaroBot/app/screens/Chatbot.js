import React, {Component} from 'react';
import {View, Text, SafeAreaView, ScrollView} from 'react-native';
import {Card, Button} from 'react-native-elements';
import {GiftedChat, Bubble} from 'react-native-gifted-chat';
import {Dialogflow_V2} from 'react-native-dialogflow';
import {dialogflowConfig} from '../env';

import firestore from '@react-native-firebase/firestore';

const botAvatar = require('../assets/images/robo1.png');

const BOT = {
  _id: 2,
  name: 'Mr.Bot',
  avatar: botAvatar,
};

class Chatbot extends Component {
  state = {
    messages: [],
    id: 1,
    name: '',
  };

  componentDidMount() {
    Dialogflow_V2.setConfiguration(
      dialogflowConfig.client_email,
      dialogflowConfig.private_key,
      Dialogflow_V2.LANG_ENGLISH_US,
      dialogflowConfig.project_id,
    );
    const {name, id} = this.props.route.params;
    //console.log(this.props);

    firestore()
      .collection('CHATBOT_HISTORY')
      .doc('id')
      .collection('MESSAGES')
      .orderBy('createdAt', 'desc')
      .limit(15)
      .get()
      .then(snapshot => {
        let messages = snapshot.docs.map(doc => {
          const firebaseData = doc.data();

          const data = {
            _id: doc.id,
            text: doc.text,
            createdAt: new Date().getTime(),
            ...firebaseData,
          };

          if (!firebaseData.system) {
            data.user = {
              ...firebaseData.user,
              name: firebaseData.user.name,
            };
          }
          return data;
        });

        if (messages.length > 0) {
          this.setState({name, id, messages});
        } else {
          this.setState({
            name,
            id,
            messages: [
              {
                _id: 2,
                text: `Hello, ${this.props.route.params.name}. My name is Mr. Bot`,
                createdAt: new Date().getTime(),
                user: BOT,
              },
              {
                _id: 1,
                text: 'Hi',
                createdAt: new Date().getTime(),
                user: BOT,
              },
            ],
          });
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  handleGoogleResponse(result) {
    let text = result.queryResult.fulfillmentMessages[0].text.text[0];

    this.sendBotResponse(text);
  }

  sendBotResponse(text) {
    let msg;

    if (text == 'travel') {
      msg = {
        text: 'Would you like to \nbuy a plane ticket?',
        image:
          'https://cdn.britannica.com/69/155469-131-14083F59/airplane-flight.jpg',
        createdAt: new Date().getTime(),
        user: BOT,
      };
    } else if (text == 'show options') {
      msg = {
        text: 'Please choose your destination',
        createdAt: new Date().getTime(),
        user: BOT,
        isOptions: true,
        data: [
          {
            title: 'Russia',
            image:
              'https://thumbs.dreamstime.com/b/moscow-russia-red-square-view-st-basil-s-cathedral-moscow-russia-red-square-view-st-basil-s-cathedral-125496295.jpg',
          },
          {
            title: 'India',
            image: 'https://i.ytimg.com/vi/i8oRgCKiZbM/maxresdefault.jpg',
          },
          {
            title: 'USA',
            image:
              'https://thumbs.dreamstime.com/b/atlanta-georgia-usa-downtown-skyline-atlanta-georgia-usa-110765393.jpg',
          },
        ],
      };
    } else {
      msg = {
        text,
        createdAt: new Date().getTime(),
        user: BOT,
      };
    }

    const {id} = this.props.route.params;

    firestore()
      .collection('CHATBOT_HISTORY')
      .doc(id)
      .collection('MESSAGES')
      .add(msg);

    msg._id = this.state.messages.length + 1;

    this.setState((previousState) => ({
      messages: GiftedChat.append(previousState.messages, [msg]),
    }));
  }

  onSend(messages = []) {
    this.setState((previousState) => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }));

    let text = messages[0].text;
    const {id, name} = this.props.route.params;

    firestore()
      .collection('CHATBOT_HISTORY')
      .doc(id)
      .collection('MESSAGES')
      .add({
        text,
        createdAt: new Date().getTime(),
        user: {
          _id: 1,
          name: name,
        },
      });

    Dialogflow_V2.requestQuery(
      text,
      result => this.handleGoogleResponse(result),
      error => console.log(error),
    );
  }

  onQuickReply(quickReply) {
    this.setState(previousState => ({
      messages: GiftedChat.append(previousState.messages, quickReply),
    }));

    let message = quickReply[0].value;
    Dialogflow_V2.requestQuery(
      message,
      result => this.handleGoogleResponse(result),
      error => console.log(error),
    );
  }

  renderBubble = props => {
    if (props.currentMessage.isOptions) {
      return (
        <ScrollView style={{backgroundColor: 'white'}} horizontal={true}>
          {props.currentMessage.data.map(item => {
            return (
              <Card
                containerStyle={{
                  padding: 0,
                  borderRadius: 15,
                  paddingBottom: 7,
                  overflow: 'hidden',
                }}
                key={item.title}>
                <Card.Image
                  style={{width: 220, height: 110}}
                  resizeMode="cover"
                  source={{uri: item.image}}></Card.Image>
                <Card.Divider />
                <Card.Title>{item.title}</Card.Title>
                <Button
                  title="Choose"
                  style={{height: 35}}
                  onPress={() => this.sendBotResponse(item.title)}
                />
              </Card>
            );
          })}
        </ScrollView>
      );
    }

    return (
      <Bubble
        {...props}
        textStyle={{right: {color: 'white'}}}
        wrapperStyle={{
          left: {backgroundColor: 'yellow'},
          right: {backgroundColor: 'pink'},
        }}
      />
    );
  };

  render() {
    return (
      <View style={{flex: 1, backgroundColor: '#fff'}}>
        <GiftedChat
          messages={this.state.messages}
          onSend={message => this.onSend(message)}
          onQuickReply={quickReply => this.onQuickReply(quickReply)}
          renderBubble={this.renderBubble}
          user={{_id: 1}}
        />
      </View>
    );
  }
}

export default Chatbot;
