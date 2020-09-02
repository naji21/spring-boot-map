package com.base.file.controller;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.geotools.data.DataStore;
import org.geotools.data.DataStoreFinder;
import org.geotools.data.FeatureSource;
import org.geotools.feature.FeatureCollection;
import org.geotools.feature.FeatureIterator;
import org.geotools.gml2.GML;
import org.geotools.referencing.CRS;
import org.kabeja.dxf.DXFArc;
import org.kabeja.dxf.DXFColor;
import org.kabeja.dxf.DXFDocument;
import org.kabeja.dxf.DXFEntity;
import org.kabeja.dxf.DXFLayer;
import org.kabeja.dxf.DXFLine;
import org.kabeja.dxf.DXFPoint;
import org.kabeja.dxf.DXFPolyline;
import org.kabeja.dxf.DXFText;
import org.kabeja.dxf.DXFVertex;
import org.kabeja.parser.ParseException;
import org.kabeja.parser.Parser;
import org.kabeja.parser.ParserBuilder;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.WKTReader;
import org.locationtech.jts.io.gml2.GMLWriter;
import org.opengis.feature.Property;
import org.opengis.feature.simple.SimpleFeature;
import org.opengis.feature.simple.SimpleFeatureType;
import org.opengis.filter.Filter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.base.file.domain.AttechFile;

import net.lingala.zip4j.ZipFile;
import net.lingala.zip4j.exception.ZipException;

@RequestMapping("/file")
@RestController
public class FileController {

	private final Logger logger = LoggerFactory.getLogger(FileController.class);

	// Save the uploaded file to this folder
	private static String UPLOADED_FOLDER = "D://temp//";

	// 3.1.1 Single file upload
	@PostMapping("/api/upload")
	// If not @RestController, uncomment this
	// @ResponseBody
	public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile uploadfile) {

		String resultData = "";
		logger.debug("Single file upload!");

		if (uploadfile.isEmpty()) {
			return new ResponseEntity("please select a file!", HttpStatus.OK);
		}

		try {
			/**
		     * save file to temp
		     */
		    File zip = File.createTempFile(UUID.randomUUID().toString(), "temp");
		    FileOutputStream o = new FileOutputStream(zip);
		    IOUtils.copy(uploadfile.getInputStream(), o);
		    o.close();

		    /**
		     * unizp file from temp by zip4j
		     */
		    String destination = "D:\\temp";
		    try {
		         ZipFile zipFile = new ZipFile(zip);
		         
		         String type = "";
		         String filePath = "";
		         
		         if(zipFile.isValidZipFile()) {
			         destination = destination + "\\" + UUID.randomUUID().toString() + "_" +zip.getName();
			         
			         File folder = new File(destination);
			         
			         zipFile.extractAll(destination);
			         
			         for( File file : folder.listFiles()) {
			        	 if(file.getName().indexOf(".dxf") != -1) {
			        		 type = "dxf";
			        		 filePath = destination + "\\" + file.getName();
			        		 break;
			        	 }else if(file.getName().indexOf(".shp") != -1) {
			        		 type = "shp";
			        		 filePath = destination + "\\" + file.getName();
			        		break; 
			        	 }
			         }
		         }else {
		        	 type = "dxf";
		        	 
		        	 destination = destination + "\\" + UUID.randomUUID().toString() + "_" +uploadfile.getName();
		        	 
		        	 File file = new File(destination);
		        	 FileOutputStream fop = new FileOutputStream(file);
					IOUtils.copy(uploadfile.getInputStream(), fop);
					o.close();
		        	 
		        	 filePath = destination;
		         }
		         
		         resultData = parseFileData(type, filePath);
		    } catch (ZipException e) {
		        e.printStackTrace();
		    } finally {
		        /**
		         * delete temp file
		         */
		        //zip.delete();
		    	
		    }

		} catch (IOException e) {
			return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
		}

		return new ResponseEntity(resultData, new HttpHeaders(), HttpStatus.OK);

	}

	// 3.1.2 Multiple file upload
	@PostMapping("/api/upload/multi")
	public ResponseEntity<?> uploadFileMulti(@RequestParam("extraField") String extraField,
			@RequestParam("files") MultipartFile[] uploadfiles) {

		logger.debug("Multiple file upload!");

		// Get file name
		String uploadedFileName = Arrays.stream(uploadfiles).map(x -> x.getOriginalFilename())
				.filter(x -> !StringUtils.isEmpty(x)).collect(Collectors.joining(" , "));

		if (StringUtils.isEmpty(uploadedFileName)) {
			return new ResponseEntity("please select a file!", HttpStatus.OK);
		}

		try {

			saveUploadedFiles(Arrays.asList(uploadfiles));

		} catch (IOException e) {
			return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
		}

		return new ResponseEntity("Successfully uploaded - " + uploadedFileName, HttpStatus.OK);

	}

	// 3.1.3 maps html form to a Model
	@PostMapping("/api/upload/multi/model")
	public ResponseEntity<?> multiUploadFileModel(@ModelAttribute AttechFile model) {

		logger.debug("Multiple file upload! With UploadModel");

		try {

			saveUploadedFiles(Arrays.asList(model.getFiles()));

		} catch (IOException e) {
			return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
		}

		return new ResponseEntity("Successfully uploaded!", HttpStatus.OK);

	}

	// save file
	private void saveUploadedFiles(List<MultipartFile> files) throws IOException {

		for (MultipartFile file : files) {

			if (file.isEmpty()) {
				continue; // next pls
			}

			byte[] bytes = file.getBytes();
			Path path = Paths.get(UPLOADED_FOLDER + file.getOriginalFilename());
			Files.write(path, bytes);

		}

	}

	// save file
	private String parseFileData(List<MultipartFile> files) throws IOException {
		String resultStr = "";

		for (MultipartFile file : files) {

			if (file.isEmpty()) {
				continue; // next pls
			}

			if (file.getOriginalFilename().indexOf(".dxf") != -1)
				resultStr += getDxfToGML(file.getInputStream());
//			else
//				resultStr += getShpToGML(file.getInputStream());
		}

		return resultStr;
	}
	
	private String parseFileData(String type, String filePath) throws IOException {
		String resultStr = "";

		if (type == "dxf") {
			InputStream inputStream = new FileInputStream(new File(filePath));
			
			resultStr += getDxfToGML(inputStream);
		}else {
			resultStr += getShpToGML(filePath);
		}
		return resultStr;
	}

	private String getDxfToGML(InputStream inputStream) {
		String dxfParsingString = "";
		Parser parser = ParserBuilder.createDefaultParser();
		String EPSG_CODE = "3857";

		StringBuilder buffer = new StringBuilder();
		buffer.append("<wfs:FeatureCollection xmlns:wfs=\"http://www.opengis.net/wfs\">");
		try {
			InputStream in = inputStream;
			// PARSE THE SUPPLIED DXF FILE
			parser.parse(in, "UTF-8");

			// get the documnet and its layers
			DXFDocument doc = parser.getDocument();
			Iterator lyrsIt = doc.getDXFLayerIterator();
			int counter = 0;
			// Loop through layers found
			while (lyrsIt.hasNext()) {
				DXFLayer layer = (DXFLayer) lyrsIt.next();
				System.out.println("layername=" + layer.getName());

				String lyrname = layer.getName();
				int lyrcolor = layer.getColor();
				String rgbcolor = DXFColor.getRGBString(lyrcolor);
				String[] cols = rgbcolor.split(",");
				// convert the layer color to hex color code
				Color mycolor = new Color(Integer.parseInt(cols[0]), Integer.parseInt(cols[1]),
						Integer.parseInt(cols[2]));
				String hex = "#" + Integer.toHexString(mycolor.getRGB()).substring(2);

				Iterator lyrTypesExist = layer.getDXFEntityTypeIterator();
				while (lyrTypesExist.hasNext()) {
					String type = (String) lyrTypesExist.next();
					Iterator entities = layer.getDXFEntities(type).iterator();
					// loop through layer entities
					while (entities.hasNext()) {

						DXFEntity entity = (DXFEntity) entities.next();
						String entType = entity.getType();
						System.out.println("entType found=" + entType);
						
						if (entType.equals("LWPOLYLINE") || entType.equals("POLYLINE")) {
							// System.out.println("LWPOLYLINE FOUND IN LAYER "+lyrname);
							counter = counter + 1;
							DXFPolyline poly = (DXFPolyline) entity;
							
							int vertCount = poly.getVertexCount();
							// System.out.println("VERTS COUNT="+vertCount);
							buffer.append("<gml:featureMember xmlns:gml=\"http://www.opengis.net/gml\">");
							buffer.append(
									"<feature:features xmlns:feature=\"http://mapserver.gis.umn.edu/mapserver\" >");
							buffer.append("<feature:geometry>");
							buffer.append("<gml:LineString srsName=\"http://www.opengis.net/def/crs/EPSG/0/" + EPSG_CODE
									+ "\"><gml:coordinates xmlns:gml=\"http://www.opengis.net/gml\" decimal=\".\" cs=\",\" ts=\"\">");
							for (int i = 0; i < vertCount; i++) {
								DXFVertex vertex = poly.getVertex(i);
								double vertX = vertex.getPoint().getX();
								double vertY = vertex.getPoint().getY();
								buffer.append(vertX);
								buffer.append(",");
								buffer.append(vertY);
								buffer.append(" ");
							}
							buffer.append("</gml:coordinates></gml:LineString>");
							buffer.append("</feature:geometry>");
							buffer.append("<feature:id>");
							buffer.append(counter);
							buffer.append("</feature:id>");
							buffer.append("<feature:layername>");
							buffer.append(lyrname);
							buffer.append("</feature:layername>");
							buffer.append("<feature:type>");
							buffer.append(entType);
							buffer.append("</feature:type>");
							buffer.append("<feature:label>");
							buffer.append(" ");
							buffer.append("</feature:label>");
							buffer.append("<feature:color>");
							buffer.append(hex);
							buffer.append("</feature:color>");
							buffer.append("</feature:features>");
							buffer.append("</gml:featureMember>");
						}
						if (entType.equals("LINE")) {
							counter = counter + 1;
							// System.out.println("LINE FOUND");
							DXFLine line = (DXFLine) entity;
							double vertX1 = line.getStartPoint().getX();
							double vertY1 = line.getStartPoint().getY();
							double vertX2 = line.getEndPoint().getX();
							double vertY2 = line.getEndPoint().getY();
							buffer.append("<gml:featureMember xmlns:gml=\"http://www.opengis.net/gml\">");
							buffer.append(
									"<feature:features xmlns:feature=\"http://mapserver.gis.umn.edu/mapserver\" >");
							buffer.append("<feature:geometry>");
							buffer.append("<gml:LineString srsName=\"http://www.opengis.net/def/crs/EPSG/0/" + EPSG_CODE
									+ "\"><gml:coordinates xmlns:gml=\"http://www.opengis.net/gml\" decimal=\".\" cs=\",\" ts=\"\">");
							buffer.append(vertX1);
							buffer.append(",");
							buffer.append(vertY1);
							buffer.append(" ");
							buffer.append(vertX2);
							buffer.append(",");
							buffer.append(vertY2);
							buffer.append(" ");
							buffer.append("</gml:coordinates></gml:LineString>");
							buffer.append("</feature:geometry>");
							buffer.append("<feature:id>");
							buffer.append(counter);
							buffer.append("</feature:id>");
							buffer.append("<feature:layername>");
							buffer.append(lyrname);
							buffer.append("</feature:layername>");
							buffer.append("<feature:type>");
							buffer.append(entType);
							buffer.append("</feature:type>");
							buffer.append("<feature:label>");
							buffer.append(" ");
							buffer.append("</feature:label>");
							buffer.append("<feature:color>");
							buffer.append(hex);
							buffer.append("</feature:color>");
							buffer.append("</feature:features>");
							buffer.append("</gml:featureMember>");

						}
						if (entType.equals("POINT")) {
							counter = counter + 1;
							// System.out.println("POINT FOUND");
							DXFPoint point = (DXFPoint) entity;
							double pointX = point.getX();
							double pointY = point.getY();
							buffer.append("<gml:featureMember xmlns:gml=\"http://www.opengis.net/gml\">");
							buffer.append(
									"<feature:features xmlns:feature=\"http://mapserver.gis.umn.edu/mapserver\" >");
							buffer.append("<feature:geometry>");
							buffer.append("<gml:Point srsName=\"http://www.opengis.net/def/crs/EPSG/0/" + EPSG_CODE
									+ "\"><gml:coordinates xmlns:gml=\"http://www.opengis.net/gml\" decimal=\".\" cs=\",\" ts=\"\">");
							buffer.append(pointX);
							buffer.append(",");
							buffer.append(pointY);
							buffer.append(" ");
							buffer.append("</gml:coordinates></gml:Point>");
							buffer.append("</feature:geometry>");
							buffer.append("<feature:id>");
							buffer.append(counter);
							buffer.append("</feature:id>");
							buffer.append("<feature:layername>");
							buffer.append(lyrname);
							buffer.append("</feature:layername>");
							buffer.append("<feature:type>");
							buffer.append(entType);
							buffer.append("</feature:type>");
							buffer.append("<feature:label>");
							buffer.append(" ");
							buffer.append("</feature:label>");
							buffer.append("<feature:color>");
							buffer.append(hex);
							buffer.append("</feature:color>");
							buffer.append("</feature:features>");
							buffer.append("</gml:featureMember>");
						}
						if (entType.equals("TEXT")) {
							counter = counter + 1;
							// System.out.println("TEXT FOUND");
							DXFText text = (DXFText) entity;
							double vertX = text.getInsertPoint().getX();
							double vertY = text.getInsertPoint().getY();
							String label = text.getText().replace("\"", " ");
							buffer.append("<gml:featureMember xmlns:gml=\"http://www.opengis.net/gml\">");
							buffer.append(
									"<feature:features xmlns:feature=\"http://mapserver.gis.umn.edu/mapserver\" >");
							buffer.append("<feature:geometry>");
							buffer.append("<gml:Point srsName=\"http://www.opengis.net/def/crs/EPSG/0/" + EPSG_CODE
									+ "\"><gml:coordinates xmlns:gml=\"http://www.opengis.net/gml\" decimal=\".\" cs=\",\" ts=\"\">");
							buffer.append(vertX);
							buffer.append(",");
							buffer.append(vertY);
							buffer.append(" ");
							buffer.append("</gml:coordinates></gml:Point>");
							buffer.append("</feature:geometry>");
							buffer.append("<feature:id>");
							buffer.append(counter);
							buffer.append("</feature:id>");
							buffer.append("<feature:layername>");
							buffer.append(lyrname);
							buffer.append("</feature:layername>");
							buffer.append("<feature:type>");
							buffer.append(entType);
							buffer.append("</feature:type>");
							buffer.append("<feature:label>");
							buffer.append(label);
							buffer.append("</feature:label>");
							buffer.append("<feature:color>");
							buffer.append(hex);
							buffer.append("</feature:color>");
							buffer.append("</feature:features>");
							buffer.append("</gml:featureMember>");
						}
					}
				}
			}
			buffer.append("</wfs:FeatureCollection>");
		} catch (ParseException e) {
			e.printStackTrace();
		}
		dxfParsingString = buffer.toString();
		buffer.setLength(0); // flush it

		return dxfParsingString;
	}
	
	private String getShpToGML(String filePath) {
		StringBuilder buffer = new StringBuilder();
		
		try {
			File file = new File(filePath);
		    Map<String, Object> map = new HashMap<>();
		    map.put("url", file.toURI().toURL());
		    
		    DataStore dataStore = DataStoreFinder.getDataStore(map);
		    
		    String typeName = dataStore.getTypeNames()[0];
		    
		    FeatureSource<SimpleFeatureType, SimpleFeature> source =
		            dataStore.getFeatureSource(typeName);
		    Filter filter = Filter.INCLUDE; // ECQL.toFilter("BBOX(THE_GEOM, 10,20,30,40)")
		
		    buffer.append("<wfs:FeatureCollection xmlns:wfs=\"http://www.opengis.net/wfs\">");
		    
		    FeatureCollection<SimpleFeatureType, SimpleFeature> collection = source.getFeatures(filter);
		    try (FeatureIterator<SimpleFeature> features = collection.features()) {
		        while (features.hasNext()) {
		            SimpleFeature feature = features.next();
		            System.out.print(feature.getID());
		            System.out.print(": ");
		            
		            for (Property attribute : feature.getProperties()) {
		                System.out.println("\t" + attribute.getName() + ":" + attribute.getValue());
		            }
		            System.out.println(feature.getDefaultGeometryProperty().getValue());
		            buffer.append("<gml:featureMember xmlns:gml=\"http://www.opengis.net/gml\">");
					buffer.append(
							"<feature:features xmlns:feature=\"http://mapserver.gis.umn.edu/mapserver\" >");
					buffer.append("<feature:geometry>");
		            buffer.append(WKTToGML2(feature.getDefaultGeometryProperty().getValue().toString()));
		            buffer.append("</feature:geometry>");
		            buffer.append("</feature:features>");
		            buffer.append("</gml:featureMember>");
		        }
		    }
		    buffer.append("</wfs:FeatureCollection>");
		}catch (Exception e) {
			// TODO: handle exception
		}
		
		return buffer.toString();
	}
	
	private String WKTToGML2(String wkt) throws IOException, ParseException, org.locationtech.jts.io.ParseException {
	    WKTReader wktR = new WKTReader();
	    Geometry geom = wktR.read(wkt);
	    
	    GMLWriter writer = new GMLWriter();
        writer.setNamespace(true);
        //writer.setSrsName(CRS.toSRS(pa.getFeature().getType().getCoordinateReferenceSystem()));
        String s = writer.write(geom);
        return s.toString();
	}
}