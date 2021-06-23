import React, {Component} from 'react';
import {
  View,
  Text,
  DeviceEventEmitter,
  PermissionsAndroid,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableHighlight,
  Modal,
  TextInput,
} from 'react-native';
import MusicFiles from 'react-native-get-music-files-v3dev-test';
import TrackPlayer from 'react-native-track-player';
import ProgressBar from '../../components/ProgressComponent';

class MusicFilesData extends Component {
  constructor(props) {
    super(props);
    this.state = {
      songsData: [],
      songsDataForSearch: [],
      loader: false,
      currentTrack: null,
      isPlaying: false,
      currentPosition: 0,
      openSearchView: false,
      searchText: '',
      matchForSearch: false,
      openPlayerModal: false,
    };
  }

  async componentDidMount() {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      stopWithApp: true,
      capabilities: [
        TrackPlayer.CAPABILITY_PLAY,
        TrackPlayer.CAPABILITY_PAUSE,
        TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
        TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
        TrackPlayer.CAPABILITY_STOP,
      ],
      compactCapabilities: [
        TrackPlayer.CAPABILITY_PLAY,
        TrackPlayer.CAPABILITY_PAUSE,
      ],
    });
    this.getPermissions();
  }

  getPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Access storage',
          message:
            'Cool Photo App needs access to your storage ' +
            'so you can play awesome music.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the storage for app');
        // await TrackPlayer.setupPlayer().then(() => {
        //   // The player is ready to be used
        //   this.getAllFiles();
        // });
        this.setState({loader: true});
        this.getMusicFiles();
      } else {
        console.log('Storage permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  getMusicFiles = () => {
    MusicFiles.getAll({
      id: true,
      blured: false,
      artist: true,
      duration: true, //default : true
      cover: true, //default : true,
      title: true,
      cover: true,
      batchNumber: 5, //get 5 songs per batch
      minimumSongDuration: 10000, //in miliseconds,
      fields: [
        'title',
        'artwork',
        'duration',
        'artist',
        'genre',
        'lyrics',
        'albumTitle',
      ],
    })
      .then(async musics => {
        // console.log('All music : ', musics);
        let TrackData = [];
        for (let i = 0; i < musics.results.length; i++) {
          TrackData.push({
            id: musics.results[i].id,
            url: 'file://' + musics.results[i].path, // Load media from the file system
            title: musics.results[i].title,
            artist: musics.results[i].artist,
            // Load artwork from the file system:
            artwork:
              musics.results[i].cover == ''
                ? ''
                : 'file://' + musics.results[i].cover,
            duration: musics.results[i].duration,
          });
        }

        await TrackPlayer.add(TrackData).then(() => {
          // TrackPlayer.play();
        });

        this.setState(
          {songsData: TrackData, songsDataForSearch: TrackData},
          () => {
            this.setState({loader: false});
          },
        );
      })
      .catch(e => {
        console.log('error getting music', e);
      });
  };

  getCurrrentTrackInfo = () => {
    console.log('Current Track ');
    TrackPlayer.getCurrentTrack().then(track => {
      //   console.log('Current track is ' + JSON.stringify(track));
      TrackPlayer.getTrack(track).then(currentTrack => {
        console.log('Current Track ', currentTrack);
        this.setState({currentTrack}, () => {
          // this.getCurrentTrackDistance();
        });
      });
    });

    return 'Current Track';
  };

  playpause = () => {
    TrackPlayer.getState().then(Tstate => {
      console.log('T state ', Tstate);
      if (TrackPlayer.STATE_PLAYING == Tstate) {
        console.log('The player is playing now pausing');
        this.setState({isPlaying: false});
        TrackPlayer.pause();
      } else if (TrackPlayer.STATE_PAUSED == Tstate) {
        // this.getCurrentTrackDistance();
        console.log('The player is paused now playing');
        TrackPlayer.play();
        this.setState({isPlaying: true});
      } else if (TrackPlayer.STATE_STOPPED == Tstate) {
        this.setState({isPlaying: false});
        console.log('The player is stopped playing');
        this.playSong(this.state.currentTrack);
      }
      //
    });
  };

  getCurrentTrackDistance = () => {
    // this.sliderInterval = setInterval(() => {
    TrackPlayer.getPosition().then(pos => {
      // console.log(
      //   'Total duration : ' +
      //     parseInt(this.state.currentTrack.duration / 1000) +
      //     ' Current pos :' +
      //     parseInt(pos),
      // );

      let xx = pos;
      let yy = this.state.currentTrack.duration / 1000;
      let percentValue = (xx / yy) * 100;

      console.log(
        'Total duration : ' +
          yy +
          ' Current position : ' +
          xx +
          ' Percent : ' +
          percentValue,
      );

      // console.log('Percent completed :' + percentValue);
      this.setState({currentPosition: percentValue});
      if (parseInt(xx) == parseInt(yy)) {
        console.log('clearing interval');
        // clearInterval(this.sliderInterval);
        this.setState({currentPosition: 0, isPlaying: false});
      } else if (this.state.isPlaying) {
        // this.getCurrentTrackDistance();
      }
    });
    // }, 50);
  };

  playSong = async item => {
    // clearInterval(this.sliderInterval);
    this.setState({currentPosition: 0});
    await TrackPlayer.reset();
    TrackPlayer.skip;
    await TrackPlayer.add(item);
    await TrackPlayer.play();
    this.getCurrrentTrackInfo();
    this.setState({
      isPlaying: true,

      searchText: '',
      songsDataForSearch: [],
      openSearchView: false,
    });
  };

  openSearchModel = () => {
    this.setState({openSearchView: true});
  };

  closeSearchModel = () => {
    this.setState({
      openSearchView: false,
      searchText: '',
      songsDataForSearch: [],
    });
  };

  onSearchTextChange = text => {
    if (text == '') {
      this.setState({
        songsDataForSearch: this.state.songsData,
        searchText: text,
        matchForSearch: false,
      });
    } else {
      this.setState({searchText: text});
      let newSearchData = [];
      for (let i = 0; i < this.state.songsData.length; i++) {
        if (
          this.state.songsData[i].title
            .toLowerCase()
            .includes(text.toLowerCase())
        ) {
          console.log(
            'Match found for :' +
              text.toLowerCase() +
              ' as : ' +
              this.state.songsData[i].title,
          );
          newSearchData.push(this.state.songsData[i]);
          this.setState({
            songsDataForSearch: newSearchData,
            matchForSearch: true,
          });
        } else {
          // console.log(
          //   'No match found for :' +
          //     text.toLowerCase() +
          //     ' as : ' +
          //     this.state.songsData[i].title,
          // );
        }
      }
    }
  };

  playNextPrevious = nom => {
    let current = nom == 'P' ? 'Previous' : 'next';
    console.log(' Playing' + current + 'song');

    if (nom == 'N') {
      for (let i = 0; i < this.state.songsData.length; i++) {
        if (this.state.songsData[i].title == this.state.currentTrack.title) {
          console.log('Index of current song is : ' + i);
          if (i != this.state.songsData.length - 1) {
            this.playSong(this.state.songsData[i + 1]);
          }
        }
      }
    } else {
      for (let i = 0; i < this.state.songsData.length; i++) {
        if (this.state.songsData[i].title == this.state.currentTrack.title) {
          console.log('Index of current song is : ' + i);
          if (i != 0) {
            this.playSong(this.state.songsData[i - 1]);
          }
        }
      }
    }
  };

  resetPauseButton = () => {
    this.setState({isPlaying: false});
  };

  render() {
    return (
      <View style={{flex: 1, backgroundColor: 'white'}}>
        <Modal
          visible={this.state.openPlayerModal}
          transparent
          style={{backgroundColor: 'transparent', flex: 1}}>
          <View style={{flex: 1, marginTop: 50, backgroundColor: 'white'}}>
            <TouchableOpacity
              onPress={() => {
                this.setState({openPlayerModal: false});
              }}>
              <Text style={{fontSize: 20, color: 'black', alignSelf: 'center'}}>
                ====
              </Text>
            </TouchableOpacity>

            {this.state.currentTrack != null && (
              <View
                style={{
                  flex: 1,
                  borderWidth: 0.4,
                  overflow: 'hidden',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                }}>
                <Image
                  style={{
                    marginTop: 50,
                    height: 300,
                    alignSelf: 'center',
                    borderRadius: 10,
                    width: 300,
                    aspectRatio: 1,
                    resizeMode: 'contain',
                  }}
                  source={
                    this.state.currentTrack.artwork == '' ||
                    this.state.currentTrack.artwork == undefined
                      ? require('../../Assets/imgs/music.jpg')
                      : {uri: this.state.currentTrack.artwork}
                  }></Image>

                <View style={{margin: 20}}>
                  <ProgressBar
                    isPlaying={this.state.isPlaying}
                    duration={this.state.currentTrack.duration}
                    resetPauseButton={this.resetPauseButton}
                    durationShow={true}></ProgressBar>
                </View>
                <View
                  style={{
                    margin: 10,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text
                    numberOfLines={1}
                    style={{fontSize: 25, color: 'black'}}>
                    {this.state.currentTrack.title}
                  </Text>
                  <Text numberOfLines={1} style={{fontSize: 20, color: 'grey'}}>
                    {this.state.currentTrack.artist}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 20,
                  }}>
                  <TouchableOpacity
                    onPress={() => {
                      this.playNextPrevious('P');
                    }}>
                    <Image
                      style={{
                        transform: [{rotate: '180deg'}],
                        height: 50,
                        marginHorizontal: 10,
                        alignSelf: 'center',
                        width: 50,
                        aspectRatio: 1,
                        resizeMode: 'cover',
                      }}
                      source={require('../../Assets/imgs/next.png')}></Image>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      this.playpause();
                    }}>
                    <Image
                      style={{
                        height: 60,
                        marginHorizontal: 10,
                        alignSelf: 'center',
                        width: 60,
                        marginTop: -5,
                        aspectRatio: 1,
                        resizeMode: 'cover',
                      }}
                      source={
                        this.state.isPlaying
                          ? require('../../Assets/imgs/pause.png')
                          : require('../../Assets/imgs/play.png')
                      }></Image>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      this.playNextPrevious('N');
                    }}>
                    <Image
                      style={{
                        height: 50,
                        marginHorizontal: 10,
                        alignSelf: 'center',
                        width: 50,
                        aspectRatio: 1,
                        resizeMode: 'cover',
                      }}
                      source={require('../../Assets/imgs/next.png')}></Image>
                  </TouchableOpacity>
                </View>
                {/* <Text>{this.state.currentPosition}</Text> */}
              </View>
            )}

            <View
              style={{
                flexDirection: 'row',
                marginHorizontal: 20,
                marginVertical: 10,
                justifyContent: 'space-evenly',
              }}>
              <TouchableOpacity>
                <Image
                  style={{
                    height: 30,
                    width: 30,
                    resizeMode: 'contain',
                  }}
                  source={require('../../Assets/imgs/3bar.png')}></Image>
              </TouchableOpacity>
              <TouchableOpacity>
                <Image
                  style={{
                    height: 30,
                    width: 30,
                    resizeMode: 'contain',
                  }}
                  source={require('../../Assets/imgs/heart2.png')}></Image>
              </TouchableOpacity>
              <TouchableOpacity>
                <Image
                  style={{
                    height: 30,
                    width: 30,
                    resizeMode: 'contain',
                  }}
                  source={require('../../Assets/imgs/repeat.png')}></Image>
              </TouchableOpacity>
              <TouchableOpacity>
                <Image
                  style={{
                    height: 30,
                    width: 30,
                    resizeMode: 'contain',
                  }}
                  source={require('../../Assets/imgs/3dots.png')}></Image>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={{flex: 1, backgroundColor: 'white'}}>
          <Modal
            visible={this.state.openSearchView}
            transparent
            style={{backgroundColor: 'blue', flex: 1}}>
            <View style={{flex: 1, backgroundColor: 'white'}}>
              <View
                style={{
                  padding: 2,
                  borderWidth: 0.2,
                  borderColor: 'black',
                  flexDirection: 'row',
                  backgroundColor: 'white',
                }}>
                <TextInput
                  autoFocus
                  value={this.state.searchText}
                  placeholder="Search local songs"
                  style={{
                    backgroundColor: 'white',
                    flex: 1,
                    paddingLeft: 20,
                  }}
                  onChangeText={text => {
                    this.onSearchTextChange(text);
                  }}></TextInput>
                <TouchableOpacity
                  onPress={() => {
                    this.closeSearchModel();
                  }}
                  style={{alignSelf: 'center'}}>
                  <Text
                    style={{
                      fontSize: 15,
                      marginRight: 20,
                      alignSelf: 'center',
                      color: 'black',
                    }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <FlatList
                style={{
                  backgroundColor:
                    this.state.matchForSearch == true ? 'white' : '#ccc',
                }}
                data={this.state.songsDataForSearch}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity
                    onPress={async () => {
                      // clearInterval(this.sliderInterval);
                      // this.setState({currentPosition: 0});
                      // await TrackPlayer.reset();
                      // await TrackPlayer.add(item);
                      // await TrackPlayer.play();
                      // this.getCurrrentTrackInfo();
                      // this.setState({isPlaying: true});
                      this.playSong(item);
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        margin: 10,
                        marginVertical: 10,
                        backgroundColor:
                          this.state.matchForSearch == true ? 'white' : '#ccc',
                        padding: 10,
                        paddingVertical: 0,
                        borderRadius: 10,
                      }}>
                      {/* <Image
                    style={{
                      height: 100,
                      borderRadius: 10,
                      width: 100,
                      resizeMode: 'contain',
                    }}
                    source={
                      item.artwork == ''
                        ? require('../../Assets/imgs/music.jpg')
                        : {
                            uri: item.artwork,
                          }
                    }></Image> */}
                      <View
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                        }}>
                        <Text style={{fontSize: 15, color: 'black'}}>
                          {item.title}
                        </Text>
                        <Text style={{fontSize: 10, color: 'grey'}}>
                          {item.artist}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}></FlatList>
              {this.state.currentTrack != null && (
                <View
                  style={{
                    overflow: 'hidden',
                    borderWidth: 0.2,
                    borderTopLeftRadius: this.state.matchForSearch ? 20 : 0,
                    borderTopRightRadius: this.state.matchForSearch ? 20 : 0,
                  }}>
                  <View
                    style={{
                      margin: 20,
                      marginVertical: 10,
                      flexDirection: 'row',
                    }}>
                    <Image
                      style={{
                        height: 40,
                        alignSelf: 'center',
                        borderRadius: 10,
                        width: 40,
                        aspectRatio: 1,
                        resizeMode: 'contain',
                      }}
                      source={
                        this.state.currentTrack.artwork == '' ||
                        this.state.currentTrack.artwork == undefined
                          ? require('../../Assets/imgs/music.jpg')
                          : {uri: this.state.currentTrack.artwork}
                      }></Image>
                    <View
                      style={{
                        flex: 1,
                        margin: 10,
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                      }}>
                      <Text numberOfLines={1} style={{fontSize: 15}}>
                        {this.state.currentTrack.title}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{fontSize: 10, color: '#ccc'}}>
                        {this.state.currentTrack.artist}
                      </Text>
                    </View>
                    <View style={{flexDirection: 'row', marginTop: 10}}>
                      <TouchableOpacity
                        onPress={() => {
                          this.playNextPrevious('P');
                        }}>
                        <Image
                          style={{
                            transform: [{rotate: '180deg'}],
                            height: 20,
                            marginHorizontal: 10,
                            alignSelf: 'center',
                            width: 20,
                            aspectRatio: 1,
                            resizeMode: 'cover',
                          }}
                          source={require('../../Assets/imgs/next.png')}></Image>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          this.playpause();
                        }}>
                        <Image
                          style={{
                            height: 30,
                            marginHorizontal: 10,
                            alignSelf: 'center',
                            width: 30,
                            marginTop: -5,
                            aspectRatio: 1,
                            resizeMode: 'cover',
                          }}
                          source={
                            this.state.isPlaying
                              ? require('../../Assets/imgs/pause.png')
                              : require('../../Assets/imgs/play.png')
                          }></Image>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          this.playNextPrevious('N');
                        }}>
                        <Image
                          style={{
                            height: 20,
                            marginHorizontal: 10,
                            alignSelf: 'center',
                            width: 20,
                            aspectRatio: 1,
                            resizeMode: 'cover',
                          }}
                          source={require('../../Assets/imgs/next.png')}></Image>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <ProgressBar
                    isPlaying={this.state.isPlaying}
                    duration={this.state.currentTrack.duration}
                    resetPauseButton={this.resetPauseButton}
                    durationShow={false}></ProgressBar>
                </View>
              )}
            </View>
          </Modal>

          <View style={{flexDirection: 'row'}}>
            <View
              style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: 'red',
                  alignSelf: 'center',
                }}>
                Music
              </Text>
            </View>
            <View
              style={{
                margin: 10,
                marginTop: 20,
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingRight: 5,
                backgroundColor: 'white',
              }}>
              <TouchableOpacity
                onPress={() => {
                  this.openSearchModel();
                }}>
                <Image
                  style={{
                    height: 20,
                    marginRight: 10,
                    width: 20,
                    aspectRatio: 1,
                    resizeMode: 'contain',
                  }}
                  source={require('../../Assets/imgs/search.png')}></Image>
              </TouchableOpacity>
              <TouchableOpacity>
                <View style={{marginHorizontal: 10}}>
                  <View
                    style={{
                      marginVertical: 2,
                      height: 5,
                      width: 5,
                      backgroundColor: 'red',
                      borderRadius: 4,
                    }}></View>
                  <View
                    style={{
                      marginVertical: 2,
                      height: 5,
                      width: 5,
                      backgroundColor: 'red',
                      borderRadius: 4,
                    }}></View>
                  <View
                    style={{
                      marginVertical: 2,
                      height: 5,
                      width: 5,
                      backgroundColor: 'red',
                      borderRadius: 4,
                    }}></View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          {this.state.songsData.length > 0 && (
            <FlatList
              style={{backgroundColor: 'white'}}
              data={this.state.songsData}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <TouchableOpacity
                  onPress={async () => {
                    // clearInterval(this.sliderInterval);
                    // this.setState({currentPosition: 0});
                    // await TrackPlayer.reset();
                    // await TrackPlayer.add(item);
                    // await TrackPlayer.play();
                    // this.getCurrrentTrackInfo();
                    // this.setState({isPlaying: true});
                    this.playSong(item);
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      margin: 0,
                      backgroundColor:
                        this.state.currentTrack !== null &&
                        this.state.currentTrack.title == item.title
                          ? 'red'
                          : 'white',
                      padding: 10,
                      paddingHorizontal: 20,
                    }}>
                    {/* <Image
                    style={{
                      height: 100,
                      borderRadius: 10,
                      width: 100,
                      resizeMode: 'contain',
                    }}
                    source={
                      item.artwork == ''
                        ? require('../../Assets/imgs/music.jpg')
                        : {
                            uri: item.artwork,
                          }
                    }></Image> */}
                    <View
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                      }}>
                      <Text
                        style={{
                          fontSize: 15,
                          color:
                            this.state.currentTrack !== null &&
                            this.state.currentTrack.title == item.title
                              ? 'white'
                              : 'black',
                        }}>
                        {item.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          color:
                            this.state.currentTrack !== null &&
                            this.state.currentTrack.title == item.title
                              ? 'white'
                              : 'grey',
                        }}>
                        {item.artist}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}></FlatList>
          )}
          {this.state.loader && this.state.songsData.length == 0 && (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <ActivityIndicator size="large" color="blue"></ActivityIndicator>
            </View>
          )}
          {this.state.currentTrack != null && (
            <TouchableOpacity
              onPress={() => {
                this.setState({openPlayerModal: true});
              }}>
              <View
                style={{
                  borderWidth: 0.2,
                  borderTopLeftRadius: 10,
                  borderTopRightRadius: 10,
                }}>
                <View
                  style={{
                    margin: 20,
                    marginVertical: 10,
                    flexDirection: 'row',
                  }}>
                  <Image
                    style={{
                      height: 40,
                      alignSelf: 'center',
                      borderRadius: 10,
                      width: 40,
                      aspectRatio: 1,
                      resizeMode: 'contain',
                    }}
                    source={
                      this.state.currentTrack.artwork == '' ||
                      this.state.currentTrack.artwork == undefined
                        ? require('../../Assets/imgs/music.jpg')
                        : {uri: this.state.currentTrack.artwork}
                    }></Image>
                  <View
                    style={{
                      flex: 1,
                      margin: 10,
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                    }}>
                    <Text numberOfLines={1} style={{fontSize: 15}}>
                      {this.state.currentTrack.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{fontSize: 10, color: '#ccc'}}>
                      {this.state.currentTrack.artist}
                    </Text>
                  </View>
                  <View style={{flexDirection: 'row', marginTop: 10}}>
                    <TouchableOpacity
                      onPress={() => {
                        this.playNextPrevious('P');
                      }}>
                      <Image
                        style={{
                          transform: [{rotate: '180deg'}],
                          height: 20,
                          marginHorizontal: 10,
                          alignSelf: 'center',
                          width: 20,
                          aspectRatio: 1,
                          resizeMode: 'cover',
                        }}
                        source={require('../../Assets/imgs/next.png')}></Image>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        this.playpause();
                      }}>
                      <Image
                        style={{
                          height: 30,
                          marginHorizontal: 10,
                          alignSelf: 'center',
                          width: 30,
                          marginTop: -5,
                          aspectRatio: 1,
                          resizeMode: 'cover',
                        }}
                        source={
                          this.state.isPlaying
                            ? require('../../Assets/imgs/pause.png')
                            : require('../../Assets/imgs/play.png')
                        }></Image>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        this.playNextPrevious('N');
                      }}>
                      <Image
                        style={{
                          height: 20,
                          marginHorizontal: 10,
                          alignSelf: 'center',
                          width: 20,
                          aspectRatio: 1,
                          resizeMode: 'cover',
                        }}
                        source={require('../../Assets/imgs/next.png')}></Image>
                    </TouchableOpacity>
                  </View>
                </View>
                {/* <Text>{this.state.currentPosition}</Text> */}

                <ProgressBar
                  isPlaying={this.state.isPlaying}
                  duration={this.state.currentTrack.duration}
                  resetPauseButton={this.resetPauseButton}
                  durationShow={false}></ProgressBar>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
}

export default MusicFilesData;
