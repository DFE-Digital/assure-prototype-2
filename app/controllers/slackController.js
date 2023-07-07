
// Global
var axios = require('axios')


const slackApiUrl = 'https://slack.com/api';
const token = process.env.SLACK_TOKEN;





exports.g_create_channel = function (req, res) {
    const channelName = 'sas-alpha-test-2';
    const userId = 'U02SS33937G';
    const message = 'Artefact has been added by Kerry Lyons. Content strategy - https://service-assessments.herokuapp.com/team/artefacts/429';
    const channelID = "C05F75U39PB";

    const userEmail = 'andy.jones@education.gov.uk';

    //getUserIDByEmail(userEmail);

    //createPrivateChannel(channelName, userId, userId, message);
    postMessage(channelID, message);
}

async function postMessage(channel, message) {
    try {
      const response = await axios.post(
        `${slackApiUrl}/chat.postMessage`,
        {
          channel: channel,
          text: message
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
  
      if (response.data.ok) {
        console.log('Message posted successfully.');
      } else {
        console.error('Error posting message:', response.data.error);
      }
    } catch (error) {
      console.error('Error posting message:', error.response.data);
    }
  }



async function getUserIDByEmail(email) {
    try {
        const response = await axios.get(`${slackApiUrl}/users.lookupByEmail`, {
            params: {
                email: email
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.data.ok) {
            const userId = response.data.user.id;
            console.log(`User ID for ${email}: ${userId}`);
        } else {
            console.error('Error retrieving user ID:', response);
        }
    } catch (error) {
        console.error('Error retrieving user ID:', error.data.error);
    }
}

async function createPrivateChannel(channelName, userId, ownerId, message) {

    var channelId = ""

    try {
        // Step 1: Create the private channel
        const createChannelResponse = await axios.post(
            `${slackApiUrl}/conversations.create`,
            {
                name: channelName,
                is_private: true
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    channelId = createChannelResponse.data.channel.id;

    } catch (error) {
        console.error('Error creating private channel:', error);
    }


    try {
        // Step 2: Invite the user to the private channel
        await axios.post(
            `${slackApiUrl}/conversations.invite`,
            {
                channel: channelId,
                users: userId
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    } catch (error) {
        console.error('Error inviting user:', error);
    }

    try {
        // Step 3: Set the owner of the private channel
        await axios.post(
            `${slackApiUrl}/conversations.setPurpose`,
            {
                channel: channelId,
                purpose: `Ownership transfer to <@${ownerId}>`
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    } catch (error) {
        console.error('Error setting purpose:', error);
    }

    try {
        await axios.post(
            `${slackApiUrl}/conversations.setOwner`,
            {
                channel: channelId,
                user: ownerId
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );


       
    } catch (error) {
        console.error('Error setting owner:', error);
    }



    try {
        const response = await axios.post(
          `${slackApiUrl}/chat.postMessage`,
          {
            channel: channelId,
            text: message
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
    
        if (response.data.ok) {
          console.log('Message posted successfully.');
        } else {
          console.error('Error posting message:', response.data.error);
        }
      } catch (error) {
        console.error('Error posting message:', error.response.data);
      }
}