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
#include <isense/modules/core_module/core_module.h>

#include <isense/modules/environment_module/environment_module.h>
#include <isense/modules/environment_module/temp_sensor.h>
#include <isense/modules/environment_module/light_sensor.h>

typedef wiselib::OSMODEL Os;
typedef Os::Uart Uart;
//typedef Os::Radio Radio;
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

		cm_ = new isense::CoreModule(value);

		led_state = 0;
		cm_->led_off();

		init_environmental_module(value);

		radio_->enable_radio();
		radio_->reg_recv_callback<RemoteApplication, &RemoteApplication::receive_radio_message> (this);

		uart_->enable_serial_comm();
		Uart::block_data_t x[] = "123456789:\n";
		uart_->write(sizeof(x) - 1, x);

		uart_->reg_read_callback<RemoteApplication,
				&RemoteApplication::receive_packet> (this);
	}

	void receive_packet(size_t len, block_data_t *buf) {

		char instruction[len];
		sprintf(instruction, "%s", buf);

		decode_instruction(instruction);
	}

	void decode_instruction(char * str) {
		char * function;
		char * ticket_id;
		char * args;

		function = strtok(str, "/");
		ticket_id = strtok(NULL, "/");
		args = strtok(NULL, "/");

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
	}

	void receive_radio_message(Os::ExtendedRadio::node_id_t from, Os::ExtendedRadio::size_t len,
			Os::ExtendedRadio::block_data_t *buf, ExtendedData const &ext) {

		size_t from_len = strlen(reinterpret_cast<char*>(from));
		size_t id_len = strlen(reinterpret_cast<char*>(radio_->id()));
		size_t response_len = from_len+id_len;

		char response[51+response_len];
		sprintf(response,"receive/%x/%x/%d/%d/%s", radio_->id(), from, ext.link_metric(), clock_->seconds(clock_->time())*1000+clock_->milliseconds(clock_->time()), buf);

		reply(response);
	}

	void broadcast(char* message, char* ticket_id) {

		size_t message_len = strlen(message);
		size_t ticket_id_len = strlen(ticket_id);
		size_t id_len = strlen(reinterpret_cast<char*>(radio_->id()));
		size_t response_len = message_len+ticket_id_len+id_len;
		char response[17+response_len];
		sprintf(response, "%s %s broadcasting at %x", ticket_id, message, radio_->id());
		reply(response);

		radio_block_data_t buffer_[512];
		radio_size_t n = snprintf((char*)buffer_, 511, "%s/%d/%s", ticket_id, clock_->seconds(clock_->time())*1000+clock_->milliseconds(clock_->time()), message);
		buffer_[n] = '\0';
		radio_size_t buffer_size_ = n + 1;

		radio_->send( Os::Radio::BROADCAST_ADDRESS, buffer_size_, buffer_);
	}

	void alert(char* message, char* ticket_id) {
		size_t msg_len = strlen(message);
		size_t id_len = strlen(ticket_id)+1;
		size_t response_len = id_len+msg_len;

		char* response = strncat(ticket_id, message, response_len);

		reply(response);
	}

	void switch_led_state(bool state, char* ticket_id) {

		char* message;

		if(!state){
			if (led_state) {
				message = (char *)"turn led off";
				led_state = false;
				cm_->led_off();
			}
			else{
				message = (char *)"led state has already been off";
			}
		}
		else {
			if (!led_state) {
				message = (char *)"turn led on";
				led_state = true;
				cm_->led_on();
			}
			else{
				message = (char *)"led state has already been on";
			}
		}

		size_t msg_len = strlen(message);
		size_t id_len = strlen(ticket_id)+1;
		size_t response_len = id_len+msg_len;

		char* response = strncat(ticket_id, message, response_len);
		reply(response);
	}

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

	void getSensorValue(char* sensor, char* ticket_id) {
		if (strcmp(sensor, "temperature") == 0) {
			get_temp(ticket_id);
		} else if (strcmp(sensor, "light") == 0) {
			get_light(ticket_id);
		}
	}

    void get_temp(char* ticket_id) {
    	int8_t temp = em_->temp_sensor()->temperature();;

    	char response[36];
		sprintf(response, "%s%i", ticket_id, temp);

		reply(response);
    }

    void get_light(char* ticket_id) {
    	uint32_t light = em_->light_sensor()->luminance();

    	char response[42];
    	sprintf(response, "%s%i", ticket_id, light);

		reply(response);
    }

    void reply(char * message) {
    	size_t len = strlen(message);

    	block_data_t buf[len];
    	strcpy((char*) buf, message);

    	uart_->write( len, buf );
    }

private:
	Os::AppMainParameter* ospointer;
	Os::ExtendedRadio::self_pointer_t radio_;
	Os::Timer::self_pointer_t timer_;
	Os::Debug::self_pointer_t debug_;
	Os::Clock::self_pointer_t clock_;
	Os::Uart::self_pointer_t uart_;

	isense::CoreModule* cm_;
	uint8_t led_state;

	isense::EnvironmentModule* em_;
};

wiselib::WiselibApplication<Os, RemoteApplication> remote_app;

void application_main(Os::AppMainParameter& value) {
	remote_app.init(value);
}
