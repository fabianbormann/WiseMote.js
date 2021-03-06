/*********************************************************************************
	Javascript Interface for Remote Controlling WISEBED Nodes (GSoC) (remote_app)
   	Copyright (C) 2013  Fabian Bormann

   	This program is free software: you can redistribute it and/or modify
    	it under the terms of the GNU General Public License as published by
    	the Free Software Foundation, either version 3 of the License, or
    	(at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

*********************************************************************************/

#include "external_interface/external_interface.h"
#include "algorithms/routing/tree/tree_routing.h"
#include "util/pstl/static_string.h"
#include "config_testing.h"
#ifdef ISENSE
#include <isense/modules/core_module/core_module.h>
#include <isense/modules/environment_module/environment_module.h>
#include <isense/modules/environment_module/temp_sensor.h>
#include <isense/modules/environment_module/light_sensor.h>
#include "algorithms/sound/basic_sound.h"
#endif

typedef wiselib::OSMODEL Os;
typedef wiselib::BasicSound<Os, Os::DAC, Os::Debug> basic_sound_t;
typedef Os::Uart Uart;
typedef Os::ExtendedRadio Radio;

class RemoteApplication {

	typedef Uart::block_data_t block_data_t;
	typedef Uart::size_t size_t;
	typedef Radio::block_data_t radio_block_data_t;
	typedef Radio::size_t radio_size_t;
	typedef Radio::ExtendedData ExtendedData;

public:

	void init(Os::AppMainParameter& value) {
		ospointer = &value;

		radio_ = &wiselib::FacetProvider<Os, Os::ExtendedRadio>::get_facet(value);
		timer_ = &wiselib::FacetProvider<Os, Os::Timer>::get_facet(value);
		debug_ = &wiselib::FacetProvider<Os, Os::Debug>::get_facet(value);
		uart_ = &wiselib::FacetProvider<Os, Os::Uart>::get_facet(value);
		clock_ = &wiselib::FacetProvider<Os, Os::Clock>::get_facet(value);
		dac_ = &wiselib::FacetProvider<Os, Os::DAC>::get_facet(value);

		dac_->init();
		basic_sound_.init( *dac_, *debug_ );

		debug_->debug("remote app booting!");

#ifdef ISENSE
		cm_ = new isense::CoreModule(value);
		led_state = 0;
		cm_->led_off();
		init_environmental_module(value);
#endif
		//Internal States
		receive_file = false; 
		sound_data_index = 0;

		radio_->enable_radio();
		radio_->reg_recv_callback<RemoteApplication, &RemoteApplication::receive_radio_message> (this);

		uart_->enable_serial_comm();

		uart_->reg_read_callback<RemoteApplication,
				&RemoteApplication::receive_packet> (this);
	}

	void receive_packet(size_t len, block_data_t *buf) {
		if(!receive_file) {
			decode_instruction((char*)buf);
		}
		else {
			receive_sound_data(buf);
		}
	}

	void decode_instruction(char * str) {
		char * function;
		char * ticket_id;
		char * args;
		char * node_id;

		function = strtok(str, "/");
		ticket_id = strtok(NULL, "/");
		node_id = strtok(NULL, "/");

		args = strtok(NULL, "/");

		char my_id[64];
#ifdef ISENSE
	    uint8 n = snprintf(my_id, 63,"%x", radio_->id());
#endif
#ifdef TINYOS
	    int n = snprintf(my_id, 63,"%x", radio_->id());
#endif
	    my_id[n] = '\0';

		if((strcmp(node_id, "all") == 0) || (strcmp(node_id, my_id) == 0)) {
			if (strcmp(function, "alert") == 0) {
				char *argument;
				argument = strtok(args, "/");
				alert(argument, ticket_id);
			}

			if (strcmp(function, "switchLed") == 0) {

				char *argument;
				argument = strtok(args, "/");

				if ((strcmp(argument, "on") == 0)) {
					switch_led_state(true, ticket_id);
				} else if ((strcmp(argument, "off") == 0)) {
					switch_led_state(false, ticket_id);
				}
			}

			if (strcmp(function, "broadcast") == 0) {

				char *argument;
				argument = strtok(args, "/");

				broadcast(argument, ticket_id);
			}

			if (strcmp(function, "getSensorValue") == 0) {

				char *argument;
				argument = strtok(args, "/");

				getSensorValue(argument, ticket_id);
			}

			if (strcmp(function, "getLedState") == 0) {
				getLedState(ticket_id);
			}

			if (strcmp(function, "play") == 0) {
				receive_sound_file(ticket_id);
			}
		}
	}

	void receive_sound_file(char* ticket_id) {
		strncpy(file_upload_ticket, ticket_id, 33);
		receive_file = true;	

		char response[64];
		sprintf(response, "%ssound", file_upload_ticket);
		reply(response);		
	}

	void receive_sound_data(uint8_t buf[]) {
		debug_->debug("Read %i to %i Bytes of sound data", sound_data_index, sound_data_index+64);
		if(buf[0] == 0xF3)  {
			debug_->debug("finish");
			receive_file = false;

			char response[128];
			sprintf(response, "%supload/finished upload start playing", file_upload_ticket);
			reply(response);

			debug_->debug("%i Bytes received start playing", sound_data_index);
			basic_sound_.play( sound_data, sound_data_index );
			sound_data_index = 0;
		}
		else {
			for (int i = 0; i < 64; i++) {
				sound_data[sound_data_index] = buf[i];
				sound_data_index++;
			}

			for (int i = 0; i < 3; i++) {
				debug_->debug("Bytes %i to %i :  %x,%x,%x,%x,%x,%x,%x,%x,%x,%x,%x,%x,%x,%x,%x,%x", i*16, (i*16)+15, buf[(i*16)], buf[(i*16)+1], buf[(i*16)+2], buf[(i*16)+3], buf[(i*16)+4], buf[(i*16)+5], buf[(i*16)+6], buf[(i*16)+7], buf[(i*16)+8], buf[(i*16)+9], buf[(i*16)+10], buf[(i*16)+11], buf[(i*16)+12], buf[(i*16)+13], buf[(i*16)+14], buf[(i*16)+15]);
			}
			
			char response[64];
			sprintf(response, "%ssound", file_upload_ticket);
			reply(response);
		}
	}

	void receive_radio_message(Os::ExtendedRadio::node_id_t from, Os::ExtendedRadio::size_t len, Os::ExtendedRadio::block_data_t *buf, ExtendedData const &ext) {
		char * ticket_id;
		char * payload;

		char * msg = (char*)buf;

		ticket_id = strtok(msg, "/");
		payload = strtok(NULL, "/");

		char response[512];
#ifdef ISENSE
		uint16 n = snprintf((char*)response, 511,"%sreceive/%x/%x/%d/%d/%s", ticket_id, from, radio_->id(), ext.link_metric(), clock_->seconds(clock_->time())*1000+clock_->milliseconds(clock_->time()), payload);
#endif
#ifdef TINYOS
		int n = snprintf((char*)response, 511,"%sreceive/%x/%x/%d/%d/%s", ticket_id, from, radio_->id(), ext.link_metric(), clock_->seconds(clock_->time())*1000+clock_->milliseconds(clock_->time()), payload);
#endif

		response[n] = '\0';

		reply(response);
	}

	void broadcast(char* message, char* ticket_id) {
		size_t message_len = strlen(message);
		size_t ticket_id_len = strlen(ticket_id);
		size_t id_len = strlen(reinterpret_cast<char*>(radio_->id()));
		size_t response_len = message_len+ticket_id_len+id_len;
		char response[32+response_len];
		sprintf(response, "%sbroadcast/%d/%x/%s", ticket_id, clock_->seconds(clock_->time())*1000+clock_->milliseconds(clock_->time()), radio_->id(), message);
		reply(response);

		radio_block_data_t buffer_[512];
		radio_size_t n = snprintf((char*)buffer_, 511, "%s/%s", ticket_id, message);
		buffer_[n] = '\0';
		radio_size_t buffer_size_ = n + 1;

		radio_->send( Os::Radio::BROADCAST_ADDRESS, buffer_size_, buffer_);
	}

	void alert(char* message, char* ticket_id) {
		size_t msg_len = strlen(message);
		size_t id_len = strlen(ticket_id)+1;
		size_t response_len = id_len+msg_len;

		char response[32+response_len];
		sprintf(response, "%salert/%s", ticket_id, message);

		reply(response);
	}

	void getLedState(char* ticket_id) {
		char buffer_[64];
		size_t n = snprintf((char*)buffer_, 63, "%sledstate/%s", ticket_id, led_state ? "true" : "false");
		buffer_[n] = '\0';

		reply(buffer_);
	}

	void switch_led_state(bool state, char* ticket_id) {
#ifdef ISENSE
		char* message;

		if(!state){
			if (led_state) {
				message = (char *)"turned off";
				led_state = false;
				cm_->led_off();
			}
			else{
				message = (char *)"already off";
			}
		}
		else {
			if (!led_state) {
				message = (char *)"turned on";
				led_state = true;
				cm_->led_on();
			}
			else{
				message = (char *)"already on";
			}
		}

		char buffer_[512];
		uint16 n = snprintf((char*)buffer_, 511, "%sswitchstate/%s", ticket_id, message);
		buffer_[n] = '\0';

		reply(buffer_);
#endif
	}

#ifdef ISENSE
	void init_environmental_module(Os::AppMainParameter& value) {
		em_ = new isense::EnvironmentModule(value);
		if (em_ != NULL) {
			em_->enable(true);
			if (em_->light_sensor()->enable()) {
				//debug_->debug("em light");
			}
			if (em_->temp_sensor()->enable()) {
				//debug_->debug("em temp");
			}
		}
	}
#endif

	void getSensorValue(char* sensor, char* ticket_id) {
		if (strcmp(sensor, "temperature") == 0) {
			get_temp(ticket_id);
		} else if (strcmp(sensor, "light") == 0) {
			get_light(ticket_id);
		}
	}

    void get_temp(char* ticket_id) {
		#ifdef ISENSE
    	int8_t temp = em_->temp_sensor()->temperature();;

    	char response[64];
		sprintf(response, "%stemp/%i", ticket_id, temp);

		reply(response);
		#endif
    }

    void get_light(char* ticket_id) {
		#ifdef ISENSE
    	uint32_t light = em_->light_sensor()->luminance();

    	char response[64];
    	sprintf(response, "%slight/%i", ticket_id, light);

		reply(response);
		#endif
    }

    void reply(char * message) {	
    	size_t len = strlen(message);
    	debug_->debug("Write Message %s with length %i", message, len);
    	uart_->write( len, (block_data_t*)message );
    }

	char *strncpy(char *dest, char *src, size_t n) {
		char *end = src + n;
		for( ; src < end && *src; src++, dest++) {
			*dest = *src;
		}
		if(src < end) { *dest = '\0'; }
		return dest;
	}    

private:
	Os::AppMainParameter* ospointer;
	Os::ExtendedRadio::self_pointer_t radio_;
	Os::Timer::self_pointer_t timer_;
	Os::Debug::self_pointer_t debug_;
	Os::Clock::self_pointer_t clock_;
	Os::Uart::self_pointer_t uart_;
	basic_sound_t basic_sound_;
	Os::DAC::self_pointer_t dac_;
#ifdef ISENSE
	isense::CoreModule* cm_;
	isense::EnvironmentModule* em_;
#endif
	uint8_t led_state;
	uint32_t sound_length;
	uint8_t sound_data[52000];
	bool receive_file;
	char* sound_data_type;
	char file_upload_ticket[33];
	int sound_data_index;
};

wiselib::WiselibApplication<Os, RemoteApplication> remote_app;

void application_main(Os::AppMainParameter& value) {
	remote_app.init(value);
}
