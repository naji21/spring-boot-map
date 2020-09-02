package com.base.file.domain;

import java.io.Serializable;

import org.springframework.web.multipart.MultipartFile;

public class AttechFile implements Serializable {

	private static final long serialVersionUID = 6839749780006018933L;

	private String extraField;

    private MultipartFile[] files;

	public String getExtraField() {
		return extraField;
	}

	public void setExtraField(String extraField) {
		this.extraField = extraField;
	}

	public MultipartFile[] getFiles() {
		return files;
	}

	public void setFiles(MultipartFile[] files) {
		this.files = files;
	}
    
    
}
