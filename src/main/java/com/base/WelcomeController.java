package com.base;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Controller
public class WelcomeController {

	// inject via application.properties
	@Value("${welcome.message:test}")
	private String message = "Hello World";

	@RequestMapping("/")
	public String welcome(Map<String, Object> model) {
		model.put("message", this.message);
		return "welcome";
	}

	@RequestMapping("/map")
	public String map(Map<String, Object> model) {
		model.put("message", this.message);
		return "map";
	}
	
	@RequestMapping("/3dmap")
	public String map3d(Map<String, Object> model) {
		model.put("message", this.message);
		return "3dmap";
	}
	
	@RequestMapping("/3dmapTest")
	public String map3dTest(Map<String, Object> model) {
		model.put("message", this.message);
		return "3dmapTest";
	}
	
	@RequestMapping("/cesium")
	public String cesium(Map<String, Object> model) {
		model.put("message", this.message);
		return "cesium";
	}
	
	@RequestMapping("/cesiumThree")
	public String cesiumThree(Map<String, Object> model) {
		model.put("message", this.message);
		return "cesiumThree";
	}
	
	@RequestMapping("/three")
	public String three(Map<String, Object> model) {
		model.put("message", this.message);
		return "three";
	}
	
	@RequestMapping("/mappingTest")
	public String mappingTest(Map<String, Object> model) {
		model.put("message", this.message);
		return "mappingTest";
	}
}