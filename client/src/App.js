import React, { Component } from 'react';
import openSocket from 'socket.io-client';
const socket = openSocket('http://localhost:3001');

class App extends Component {
 
    constructor(props) {
        super(props);
        this.state = {
            channelSelected: '#accueil',
            username : 'invité',
            usertemp : '',
            temp : '',
            tempMessage : '',
            channels: [],
            messages : [],
            users : []
        }
        this.onChange = this.onChange.bind(this);
        this.handleNickname = this.handleNickname.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
    }

    componentDidMount() {

        /*
        * User's connection
        */
        socket.on('newuser', (user) => {
            this.setState({
                messages : this.state.messages.concat({
                    channel: this.state.channelSelected,
                    author: 'system',
                    content: user.username + ' a rejoint le channel',
                    to: '',
                    whisper: 'no'
                })
            })
        });

        /*
        * User's rename
        */
        socket.on('renameuser', (user) => {
            this.setState({
                messages : this.state.messages.concat({
                    channel: this.state.channelSelected,
                    author: 'system',
                    content: user.username + ' a changé son pseudo en ' + user.rename,
                    to: '',
                    whisper: 'no'
                })
            })
        });

        /*
        * User's disconnection
        */
        socket.on('disuser', (user) => {
            this.setState({
                messages : this.state.messages.concat({
                    channel: this.state.channelSelected,
                    author: 'system',
                    content: user.username + ' a quitté le channel',
                    to: '',
                    whisper: 'no'
                })
            })
        });

        /*
        * Display users' list
        */
        socket.on('listUsers', (user) => {
            this.setState({users : []});
            for(var i in user) {
                this.setState({users : this.state.users.concat(user[i])});
            }
        })

        /*
        * Messages' details
        */
        socket.on('newmsg', (message) => {
            this.setState({
                messages : this.state.messages.concat({
                    channel: message.messages.messages.channel,
                    author: message.messages.messages.author,
                    content: message.messages.messages.content,
                    to: message.messages.messages.to,
                    whisper: message.messages.messages.whisper
                })
            })
        })

        /*
        * Display channels' list
        */
        socket.on('listChannels', (channels) => {
            this.setState({channels : []});
            for(var i in channels) {
                this.setState({channels : this.state.channels.concat(channels[i])});
            }
        })
    }

    /*
    * For the connection 
    */
    onChange(event) {
        this.setState({ usertemp: event.target.value })
    }

    handleNickname(event) {
        event.preventDefault();
        socket.emit('login', { username : this.state.usertemp })
        this.setState({ username: this.state.usertemp })
    }

    /*
    * command's function for /msg
    */
    commandMsg(tab) {
        tab = tab.filter(word => word !== tab[0]);
        this.setState({
            tempMessage : {
                channel: this.state.channelSelected,
                author: this.state.username,
                content: tab.filter(word => word !== tab[0]).join(' '),
                to: tab[0],
                whisper : 'yes'
            }
        });
    }


    /*
    * command's function for /nick
    */
    commandNickname(tab, event) {
        socket.emit('rename', {
            username : this.state.username,
            rename : tab[1],
        });
        this.setState({ username: tab[1] });
    }

    /*
    * command's function for /create
    */
    commandCreate(tab) {
        var listChan = this.state.channels.filter(channel => channel === '#' + tab[1]);
        if(listChan.length === 0 ) {
            this.setState({
                tempMessage: {
                    channel: this.state.channelSelected,
                    author: 'system',
                    content: 'Le channel a bien été créé',
                    to: '',
                    whisper : 'no'
                }
            });
            socket.emit('newChannel', {
                channel: tab[1]
            })
            socket.emit('newmessage', { messages: this.state.tempMessage });
        }
        if(listChan.length >= 1 ) {
            this.setState({
                tempMessage: {
                    channel: this.state.channelSelected,
                    author: 'system',
                    content: 'Ce channel existe déjà',
                    to: '',
                    whisper : 'no'
                }
            });
            socket.emit('newmessage', { messages: this.state.tempMessage });
        }
        return true;
    }

    /*
    *
    */
    commandJoin(tab) {
        this.setState({channelSelected: tab[1]})
    }


    /*
    * Message's sending 
    */
    handleChange(event) {
        this.setState({ temp: event.target.value });
        var tab = event.target.value.split(' ');
        var tabBegin = tab[0].split('');
        if(tab[0] === "/help") {
            this.commandHelp();
            return false;
        }
        if(tab[0] === '/msg') {
            this.commandMsg(tab);
            return false;
        }
        if(tab[0] === '/nick') {
            return false;
        }
        if(tab[0] === '/create') {
            return false;
        }
        if(tab[0] === '/join') {
            return false;
        }
        if(tabBegin[0] !== "/") {
            this.setState({
                tempMessage: {
                    channel: this.state.channelSelected,
                    author : this.state.username,
                    content: event.target.value,
                    to: '',
                    whisper: 'no'
                }
            })
        }
    }

    /*
    * message sending / form confirm
    */
    handleMessage(event) {
        event.preventDefault();
        var tab = this.state.temp.split(' ');
        if(tab[0] === '/nick') {
            if(tab[1] !== undefined && tab[1] !== '') {
                this.commandNickname(tab, event);
            }
            this.setState({temp: ''});
            return false;
        }
        if(tab[0] === '/create') {
            if(tab[1] !== undefined && tab[1] !== '') {
                this.commandCreate(tab);
            }
            this.setState({temp: ''});
            return false;
        }
        if(tab[0] === '/join') {
            if(tab[1] !== undefined && tab[1] !== '') {
                this.commandJoin(tab);
            }
        }
        socket.emit('newmessage', { messages: this.state.tempMessage });
        this.setState({temp: ''});
    }

    /*
    * Display messages
    */
    affichMessage() {
        var tab = this.state.messages.filter( messages => messages.channel === this.state.channelSelected);
        return tab.map(message => {
            if(message.author === 'system') {
                return <span className="msg"><strong>{message.content} <br/></strong></span>
            }
            if(message.to !== '' && message.to === this.state.username) {
                return <span className="msg"><em>{message.author} ta dit </em> : {message.content} <br/></span>
            }
            if(message.to !== '' && message.author === this.state.username) {
                return <span className="msg"><em> Vous avez chuchoté à {message.to}</em> : {message.content} <br/></span>
            }
            if(message.author !== 'system' && message.whisper === 'no') {
                return <span className="msg"><strong>{message.author}</strong> : {message.content} <br/></span>
            }
        });
   }

   /*
   *  Display users
   */
   displayUsersList() {
       return this.state.users.map(user => {
           return <span className="users"> {user} - </span>
       });
   }

   /*
   *  Display channel 
   */
   displayChannels() {
       return this.state.channels.map(channel => {
           return <span
                className="chan"
                value={channel}
                onClick={(event) => { this.setState({channelSelected: event.target.getAttribute('value')})}}>
                    {channel} -&nbsp;
                </span>
       })
   }

   /*
   * Render
   */
    render() {
        if(this.state.username === 'invité') {
            return (
                <div className="flex justify-center text-center p-8">
                    <div className="username">
                        <h1>Bienvenue sur My_IRC</h1>
                        <div className="p-8">
                            <span className="label">
                                Votre pseudo :
                            </span>
                        </div>

                        <form>
                            <input className='text-sm sm:text-base text-center relative w-full border rounded placeholder-gray-400 focus:border-indigo-400 focus:outline-none py-2 pr-2' type="text" onChange={ this.onChange}/>
                            <button onClick={this.handleNickname}>Se connecter</button>
                        </form>
                    </div>
                </div>
            )
        }
        if(this.state.username !== '') {
            return (
                <div className="App">
                    <div className="flex justify-center py-8">
                        <div className="max-w-sm bg-white border-2 border-gray-300 p-6 rounded-md tracking-wide shadow-lg">
                            <div className="rounded text-center relative -mb-px block border  border-grey px-4">
                                channels <br/>
                                {this.displayChannels()}
                            </div>
                            <div className="text-center">
                                <em>Bienvenue { this.state.username } sur le channel {this.state.channelSelected}</em>

                              </div>
                         </div>
                    </div>
                    <div className="flex justify-center rounded-lg  p-16">
                        <div className="grid place-items-center w-4/5 mx-auto p-10 my-20 sm:my-auto bg-gray-50 border rounded-xl shadow-2xl space-y-5 text-center">
                            <div>
                                <div id="content">
                                    {this.affichMessage()}
                                    <br/>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="flex justify-center">
                        <span className="border rounded-lg">
                            <div className="sendForm">
                                <form >
                                    <input  className="" id="msg" value={this.state.temp} onChange={ this.handleChange }/>
                                    <button  className="inline-block px-6 py-2 text-xs font-medium leading-6 text-center text-white uppercase transition bg-gray-300 rounded-full shadow ripple waves-light hover:shadow-lg focus:outline-none hover:bg-black" onClick={this.handleMessage}>Envoyer</button>
                                </form>
                            </div>
                        </span>
                    </div>
                    <div className="bg-gray-200">
                    <footer className="flex flex-wrap items-center justify-between p-3 m-auto">
                        <div className="container mx-auto flex flex-col flex-wrap items-center justify-between">
                            <div className="members">
                                Liste des membres
                                {this.displayUsersList()}
                            </div>
                        </div>
                    </footer>
                    </div>
                </div>
            )
        }
        return (<p> {this.state.username} est rentré sur le channel</p>);
    }
}

export default App;