
//==================================================================================
//	Demo001	--- Realtime 4D CG
//	2016/10/31	by pionier
//==================================================================================


window.onload = function(){
	var cnvs = document.getElementById('canvas'),
		cntrls = {},			// 旧pwgl
		gl = {},
		texBuf = [],
		views = {},
		light00 = {},
		lightShader = {},
		fieldShader = {},
		triangleShader = {},
		depthShader = {},
		shadowShader = {},
		texcubeShader = {},
		fBufferWidth	= 2048,
		fBufferHeight	= 2048,
		fShadowBuffer	= {},
		TriBuffer = {},
		TRI_BUFFER_SIZE = 4096,
		TESS_SCALE = 1.5,
		PhoenixHead_SCALE = 0.05,
		PhoenixBody_SCALE = 0.2,
		PhoenixFoot_SCALE = 0.2,
		Phoenix_OffsY = 0.8,
//		Phoenix_OffsH = 6,
		Phoenix_OffsH = 3,
		FIELD_SCALE = 1.0,
		FIELD_OFFS = 10.0,
		IFIELD_LEVEL = 7,
		FIELD_WIDTH_X = 11,
		FIELD_WIDTH_Z = 11,
		Field4D = [],
		fieldCenter = [],
		EnvCube = {},
		RoadPatch = {},
		Cylinder = {},
		Cylinder4D = [],
		Corn = {},
		Corn4D = {},
		PalBase = {},
		PalRoof = {},
		VarWall = {},
		StatueBase = {},
		PhoenixHead = {},
		PhoenixBody = {},
		PhoenixFoot = [],
		PhoenixRotate = [ 0,0,0,0,0,Math.PI ],
		tmp = 0,
		cnt = 0,
		keyStatus = [ false, false, false, false, false, false ],
		SIGHT_LENGTH = 3,
//		SIGHT_LENGTH = 10,
//		SIGHT_LENGTH = 5,
		SIGHT_HEIGHT = 2,
//		SIGHT_HEIGHT = 1,
//		SIGHT_HEIGHT = 4,
		ROT_RATE = 0.02,
//		VELOCITY = 0.1,
		VELOCITY = 0.05,
		Roller = {},
		StdShaderParam = [],
		ShadowShaderParam = [],
		CollArea = [],
		YH_Heights = [],
		areaNo = 10,
		modelMatrix		= mat4.identity(mat4.create()),
		viewMatrix		= mat4.identity(mat4.create()),
		eyeMatrix		= mat4.identity(mat4.create()),
		projMatrix		= mat4.identity(mat4.create()),
		vepMatrix		= mat4.identity(mat4.create()),
		mvpMatrix		= mat4.identity(mat4.create()),
		invMatrix		= mat4.identity(mat4.create()),
		texMatrix		= mat4.identity(mat4.create()),
		lgtMatrix		= mat4.identity(mat4.create()),
		dvMatrix		= mat4.identity(mat4.create()),
		dpMatrix		= mat4.identity(mat4.create()),
		dvpMatrix		= mat4.identity(mat4.create());
	
	
	gl = cnvs.getContext('webgl') || cnvs.getContext('experimantal-webgl');
	if( !gl ){
		alert("");
		return;
	}
	
	cnvs.width = 512;
	cnvs.height = 384;
	cnvs.whickSelected = 0;
	
	// キーイベント
	if( window.addEventListener ){
		function KeyDownFunc( evt ){
			const keyname = evt.key;
			if( keyname === 'ArrowUp' ){
				keyStatus[0] = true;
			}
			if( keyname === 'ArrowDown' ){
				keyStatus[1] = true;
			}
			if( keyname === 'ArrowLeft' ){
				keyStatus[2] = true;
			}
			if( keyname === 'ArrowRight' ){
				keyStatus[3] = true;
			}
			if( keyname === 'Shift' ){
				keyStatus[4] = true;
			}
			if( keyname === 'b' ){
				keyStatus[5] = true;
			}
		}
		
		function KeyUpFunc( evt ){
			const keyname = evt.key;
			if( keyname === 'ArrowUp' ){
				keyStatus[0] = false;
			}
			if( keyname === 'ArrowDown' ){
				keyStatus[1] = false;
			}
			if( keyname === 'ArrowLeft' ){
				keyStatus[2] = false;
			}
			if( keyname === 'ArrowRight' ){
				keyStatus[3] = false;
			}
			if( keyname === 'Shift' ){
				keyStatus[4] = false;
			}
			if( keyname === 'b' ){
				keyStatus[5] = false;
			}
		}
		// ドキュメントにリスナーを登録
		document.addEventListener( "keydown", KeyDownFunc, false );
		document.addEventListener( "keyup", KeyUpFunc, false );
		
	}
	
	// 移動方向
	moveXZ = {
		rot:	Math.PI,				// 移動方向
		vel:	0.0,				// 移動量
		dif:	[ 0.0, 0.0 ]		// 実移動量(偏差)
	};
	
	// 視線ベクトル
	views = {
		eyePosition:	[ 0,  SIGHT_HEIGHT, SIGHT_LENGTH ],
		lookAt:			[ 0, 0, 12 ],
//		lookAt:			[   0, 0, -8 ],
//		lookAt:			[ -10, 0, -8 ],
//		lookAt:			[   9, 1, -5 ],
		height:			1
	};
	areaNo = (views.lookAt[0]+FIELD_OFFS*1.5)/FIELD_OFFS + (views.lookAt[2]+FIELD_OFFS*2)/FIELD_OFFS;
	
	// 光源・環境光関連
	light00 = {
		position:	 [ -1.0, 20.0, 0.0 ],
		upDirection: [ 0.0, 0.0, 1.0 ],
		ambient:	 [ 0.3, 0.3, 0.3, 1.0 ]
	};
	
	// フィールド用テクスチャ読込
	texBuf.push( fDWL.WGL.createTexture( gl, './img/Base02.png' ) );
	texBuf.push( fDWL.WGL.createTexture( gl, './img/Base02.png' ) );
	texBuf.push( fDWL.WGL.createTexture( gl, './img/Base02.png' ) );
	texBuf.push( fDWL.WGL.createTexture( gl, './img/Base03.png' ) );
	texBuf.push( fDWL.WGL.createTexture( gl, './img/Base02.png' ) );
	texBuf.push( fDWL.WGL.createTexture( gl, './img/Base02.png' ) );
	texBuf.push( fDWL.WGL.createTexture( gl, './img/Base02.png' ) );
	
	
	// 頂点シェーダとフラグメントシェーダの生成
	lightShader.prg = createShaderProgram( gl, 'light_vs', 'light_fs' );
	lightShader.attrLoc = [
		gl.getAttribLocation(lightShader.prg, 'position'),
		gl.getAttribLocation(lightShader.prg, 'normal'),
		gl.getAttribLocation(lightShader.prg, 'color')
	];
	lightShader.attrStride = [ 3, 3, 4 ];
	lightShader.uniLoc = [
		gl.getUniformLocation(lightShader.prg, 'mvpMatrix'),
		gl.getUniformLocation(lightShader.prg, 'invMatrix'),
		gl.getUniformLocation(lightShader.prg, 'lightPosition'),
		gl.getUniformLocation(lightShader.prg, 'eyeDirection'),
		gl.getUniformLocation(lightShader.prg, 'ambientColor'),
	];
	
	// Field4D用シェーダ
	fieldShader.prg = createShaderProgram( gl, 'tex_vs', 'tex_fs' );
	fieldShader.attrLoc = [
		gl.getAttribLocation(fieldShader.prg, 'position'),
		gl.getAttribLocation(fieldShader.prg, 'normal'),
		gl.getAttribLocation(fieldShader.prg, 'color'),
		gl.getAttribLocation(fieldShader.prg, 'textureCoord')
	];
	fieldShader.attrStride = [ 3, 3, 4, 2 ];
	fieldShader.uniLoc = [
		gl.getUniformLocation(fieldShader.prg, 'mMatrix'),
		gl.getUniformLocation(fieldShader.prg, 'mvpMatrix'),
		gl.getUniformLocation(fieldShader.prg, 'invMatrix'),
		gl.getUniformLocation(fieldShader.prg, 'lightPosition'),
		gl.getUniformLocation(fieldShader.prg, 'texture0'),
		gl.getUniformLocation(fieldShader.prg, 'texture1'),
		gl.getUniformLocation(fieldShader.prg, 'rate')
	];
	fieldShader.setUniLoc = function( mdlMtx, mvpMtx, invMtx, lgtPos, tex1, tex2, rate ){
		var uniLoc = this.uniLoc;
		gl.uniformMatrix4fv( uniLoc[0], false, mdlMtx );
		gl.uniformMatrix4fv( uniLoc[1], false, mvpMtx );
		gl.uniformMatrix4fv( uniLoc[2], false, invMtx );
		gl.uniform3fv( uniLoc[3], lgtPos );
		gl.uniform1i( uniLoc[4], tex1 );
		gl.uniform1i( uniLoc[5], tex2 );
		gl.uniform1f( uniLoc[6], rate );			// Low/High rate
	};
	fieldShader.setProgram = function( param ){
		var uniLoc = this.uniLoc;
		gl.useProgram( this.prg );
		gl.uniformMatrix4fv( uniLoc[0], false, param[0] );
		gl.uniformMatrix4fv( uniLoc[1], false, param[1] );
		gl.uniformMatrix4fv( uniLoc[2], false, param[2] );
		gl.uniform3fv( uniLoc[3], param[3] );
		gl.uniform1i( uniLoc[4], param[4] );
		gl.uniform1i( uniLoc[5], param[5] );
		gl.uniform1f( uniLoc[6], param[6] );			// Low/High rate
	};
	
	// 三角バッファ用シェーダ作成
	triangleShader.prg = createShaderProgram( gl, 'triangle_vs', 'triangle_fs' );
	triangleShader.attrLoc = [
		gl.getAttribLocation( triangleShader.prg, 'aVertexPosition' ),
		gl.getAttribLocation( triangleShader.prg, 'aVertexNormal' ),
		gl.getAttribLocation( triangleShader.prg, 'aVertexColor' )
	];
	triangleShader.attrStride = [ 3, 3, 4 ];
	triangleShader.uniLoc = [
		gl.getUniformLocation( triangleShader.prg, 'mvpMatrix' ),
		gl.getUniformLocation( triangleShader.prg, 'invMatrix' ),
		gl.getUniformLocation( triangleShader.prg, 'lightPosition' ),
		gl.getUniformLocation( triangleShader.prg, 'eyeDirection' ),
		gl.getUniformLocation( triangleShader.prg, 'ambientColor' )
	];
	gl.enableVertexAttribArray( triangleShader.attrLoc[0] );
	gl.enableVertexAttribArray( triangleShader.attrLoc[1] );
	gl.enableVertexAttribArray( triangleShader.attrLoc[2] );
	
	triangleShader.setUniLoc = function( mvpMtx, invMtx, lgtPos, viewDir, color ){
		var uniLoc = this.uniLoc;
		gl.uniformMatrix4fv( uniLoc[0], false, mvpMtx );
		gl.uniformMatrix4fv( uniLoc[1], false, invMtx );
		gl.uniform3fv( uniLoc[2], light00.position );
		gl.uniform3fv( uniLoc[3], views.eyePosition );
		gl.uniform4fv( uniLoc[4], light00.ambient );
	};
	TriBuffer = new fDWL.R4D.TriangleBuffer( gl, TRI_BUFFER_SIZE );
	
	// Depth用シェーダ
	depthShader.prg = createShaderProgram( gl, 'depth_vs', 'depth_fs' );
	depthShader.attrLoc = [
		gl.getAttribLocation( depthShader.prg, 'position')
	];
	depthShader.attrStride = [ 3 ];
	depthShader.uniLoc = [
		gl.getUniformLocation( depthShader.prg, 'mvpMatrix')
	];
	depthShader.setUniLoc = function( mvpMatrix ){
		gl.uniformMatrix4fv( this.uniLoc[0], false, mvpMatrix );
	};
	depthShader.setProgram = function( param ){
		gl.useProgram( this.prg );
		gl.uniformMatrix4fv( this.uniLoc[0], false, param[0] );
	};
	
	// シャドウ用シェーダ
	shadowShader.prg = createShaderProgram( gl, 'shadow_vs', 'shadow_fs' );
	shadowShader.attrLoc = [
		gl.getAttribLocation( shadowShader.prg, 'position'),
		gl.getAttribLocation( shadowShader.prg, 'normal'),
		gl.getAttribLocation( shadowShader.prg, 'color'),
		gl.getAttribLocation( shadowShader.prg, 'textureCoord')
	];
	shadowShader.attrStride = [ 3, 3, 4, 2 ];
	shadowShader.uniLoc = [
		gl.getUniformLocation( shadowShader.prg, 'mMatrix'),
		gl.getUniformLocation( shadowShader.prg, 'mvpMatrix'),
		gl.getUniformLocation( shadowShader.prg, 'invMatrix'),
		gl.getUniformLocation( shadowShader.prg, 'texMatrix'),
		gl.getUniformLocation( shadowShader.prg, 'lgtMatrix'),
		gl.getUniformLocation( shadowShader.prg, 'lightPosition'),
		gl.getUniformLocation( shadowShader.prg, 'textureS'),
		gl.getUniformLocation( shadowShader.prg, 'texture0'),
		gl.getUniformLocation( shadowShader.prg, 'texture1'),
		gl.getUniformLocation( shadowShader.prg, 'rate')
	];
	shadowShader.setUniLoc = function( mdlMtx, mvpMtx, invMtx, texMtx, lgtMtx, lgtPos, shadow, tex1, tex2, rate ){
		var uniLoc = this.uniLoc;
		gl.uniformMatrix4fv( uniLoc[0], false, mdlMtx );
		gl.uniformMatrix4fv( uniLoc[1], false, mvpMtx );
		gl.uniformMatrix4fv( uniLoc[2], false, invMtx );
		gl.uniformMatrix4fv( uniLoc[3], false, texMtx );
		gl.uniformMatrix4fv( uniLoc[4], false, lgtMtx );
		gl.uniform3fv( uniLoc[5], lgtPos );
		gl.uniform1i( uniLoc[6], shadow );
		gl.uniform1i( uniLoc[7], tex1 );
		gl.uniform1i( uniLoc[8], tex2 );
		gl.uniform1f( uniLoc[9], rate );			// Low/High rate
	};
	shadowShader.setProgram = function( param ){
		var uniLoc = this.uniLoc;
		gl.useProgram( this.prg );
		gl.uniformMatrix4fv( uniLoc[0], false, param[0] );
		gl.uniformMatrix4fv( uniLoc[1], false, param[1] );
		gl.uniformMatrix4fv( uniLoc[2], false, param[2] );
		gl.uniformMatrix4fv( uniLoc[3], false, param[3] );
		gl.uniformMatrix4fv( uniLoc[4], false, param[4] );
		gl.uniform3fv( uniLoc[5], param[5] );
		gl.uniform1i( uniLoc[6], param[6] );
		gl.uniform1i( uniLoc[7], param[7] );
		gl.uniform1i( uniLoc[8], param[8] );
		gl.uniform1f( uniLoc[9], param[9] );			// Low/High rate
	};
	
	// シャドウ用フレームバッファ
	var fShadowBuffer = create_framebuffer( gl, fBufferWidth, fBufferHeight );
	
	// 環境テクスチャ情報
	texInfo = {
		name: [ './img/CubeSide.png', './img/CubeTop.png', './img/CubeSide.png', './img/CubeSide.png', './img/CubeBtm.png', './img/CubeSide.png' ],
		texType: gl.TEXTURE_CUBE_MAP,
		tex: 0,
		texGLPos: gl.TEXTURE0,
		pos: 0,
		mapPos: [
			gl.TEXTURE_CUBE_MAP_POSITIVE_X,
			gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
			gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
			gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
			gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
			gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
		]
	};
	createCubeTexture( gl, texInfo );
	
	// 環境テクスチャ用シェーダ
	texcubeShader.prg = createShaderProgram( gl, 'cubetex_vs', 'cubetex_fs' );
	texcubeShader.attrLoc = [
		gl.getAttribLocation( texcubeShader.prg, 'position'),
		gl.getAttribLocation( texcubeShader.prg, 'normal'),
		gl.getAttribLocation( texcubeShader.prg, 'color'),
	];
	texcubeShader.attrStride = [ 3, 3, 4 ];
	texcubeShader.uniLoc = [
		gl.getUniformLocation( texcubeShader.prg, 'mMatrix'),
		gl.getUniformLocation( texcubeShader.prg, 'mvpMatrix'),
		gl.getUniformLocation( texcubeShader.prg, 'cubeMapTexture'),
	];
	texcubeShader.setUniLoc = function( mdlMtx, mvpMtx, texInfo ){
		var uniLoc = this.uniLoc;
		gl.uniformMatrix4fv( uniLoc[0], false, mdlMtx );
		gl.uniformMatrix4fv( uniLoc[1], false, mvpMtx );
		gl.activeTexture( texInfo.texGLPos );
		gl.bindTexture( texInfo.texType, texInfo.tex );
		gl.uniform1i( uniLoc[2], false, texInfo.pos );
	};
	// 環境用大キューブ
	EnvCube = new fDWL.EnvCube( gl, 1.0, [1.0, 1.0, 1.0, 1.0], true );
	
	// 彫像頭部の生成
	PhoenixHead = new fDWL.R4D.Pylams4D(
		gl,
		triangleShader.prg,
		[ 0,Phoenix_OffsY,-5,Phoenix_OffsH ],							// pos
		PhoenixRotate,										// rotate
		[ PhoenixHead_SCALE, PhoenixHead_SCALE, PhoenixHead_SCALE, PhoenixHead_SCALE ],
		[	// vertex
			0, 1,16,  0,   0, 3,17,0,  0,7.7,10,0,  4.6,7.7,10,0,  0,7.7,10,4.6,	// 0-4
			0, 9,15.5,0,   0, 9, 8,0,  6,9, 8,0,  0,9,8,6,							// 5-8
			0,13,15,  0,   0,17, 9,0,  0,5,13,0,  0,6,8,0,							// 9-12
			0,13, 0,  0,   0,11, 2,0,  5,11,2,0,  0,11,2,5,  0,4,2,0,				// 13-17
			0,21, 2,  0,   0,15, 7,0,  1,15,7,0,  0,15,7,1,							// 18-21
			-6,9, 8,  0,   0, 9, 8,-6, -5,11,2,0,  0,11,2,-5,						// 22-25
			-4.6,7.7,10,0, 0,7.7,10,-4.6, -1,15,7,0,  0,15,7,-1						// 26-29
		],
		[	// color: 20(1つの五胞体)ごとに一単位
			// part A
			255,220,64,255, 200,190,64,255, 220,64,64,255, 220,64,64,255, 255,64,64,255,
			220, 64,64,255, 220, 64,64,255, 255,127,127,255,
			220, 64,64,255, 220, 64,64,255,
			// part B
			220,64,64,255, 220,64,64,255,
			// part C
			255,220,64,255, 200,190,64,255, 220,64,64,255, 220,64,64,255, 255,64,64,255,
			220,64,64,255, 220,64,64,255, 255,127,127,255,
			220,64,64,255, 220,64,64,255,
			// part D
			220,64,64,255, 220,64,64,255
		],
		[	// index of pylamids
			// part A
			0,1,26,3, 0,1,3,4, 0,1,26,4, 0,26,3,4, 1,26,3,4,
			1,5,22,7, 1,5,22,8, 1,5,7,8, 1,22,7,8, 5,22,7,8,
			5,9,22,7, 5,9,22,8, 5,9,7,8, 5,22,7,8, 9,22,7,8,
			9,10,22,7, 9,10,22,8, 9,10,7,8, 9,22,7,8, 10,22,7,8,
			11,12,22,7, 11,12,22,8, 11,12,7,8, 11,22,7,8, 12,22,7,8,
			10,13,24,15, 10,13,24,16, 10,13,15,16, 10,24,15,16, 13,24,15,16,
			12,17,24,15, 12,17,24,16, 12,17,15,16, 12,24,15,16, 17,24,15,16,
			10,18,28,20, 10,18,28,21, 10,18,20,21, 10,28,20,21, 18,28,20,21,
			10,15,16,7, 10,15,16,8, 10,15,7,8, 10,16,7,8, 15,16,7,8,
			12,15,16,7, 12,15,16,8, 12,15,7,8, 12,16,7,8, 15,16,7,8,
			// part B
			10,24,25,22, 10,24,25,23, 10,24,22,23, 10,25,22,23, 24,25,22,23,
			12,24,25,22, 12,24,25,23, 12,24,22,23, 12,25,22,23, 24,25,22,23,
			// part C
			0,1,26,3, 0,1,26,27, 0,1,3,27, 0,26,3,27, 1,26,3,27,
			1,5,22,7, 1,5,22,23, 1,5,7,23, 1,22,7,23, 5,22,7,23,
			5,9,22,7, 5,9,22,23, 5,9,7,23, 5,22,7,23, 9,22,7,23,
			9,10,22,7, 9,10,22,23, 9,10,7,23, 9,22,7,23, 10,22,7,23,
			11,12,22,7, 11,12,22,23, 11,12,7,23, 11,22,7,23, 12,22,7,23,
			10,13,24,15, 10,13,24,25, 10,13,15,25, 10,24,15,25, 13,24,15,25,
			12,17,24,15, 12,17,24,25, 12,17,15,25, 12,24,15,25, 17,24,15,25,
			10,18,28,20, 10,18,28,29, 10,18,20,29, 10,28,20,29, 18,28,20,29,
			10,15,25, 7, 10,15,25,23, 10,15, 7,23, 10,25, 7,23, 15,25, 7,23,
			12,15,25, 7, 12,15,25,23, 12,15, 7,23, 12,25, 7,23, 15,25, 7,23,
			// part D
			10,24,16,22, 10,24,16, 8, 10,24,22, 8, 10,16,22, 8, 24,16,22, 8,
			12,24,16,22, 12,24,16, 8, 12,24,22, 8, 12,16,22, 8, 24,16,22, 8
		],
		[	// chrnIdx: 各五胞体の構成頂点index
			// part A
			0,1,26,3,4, 1,5,22,7,8, 5,9,22,7,8, 9,10,22,7,8, 11,12,22,7,8,
			10,13,24,15,16, 12,17,24,15,16, 10,18,28,20,21,
			10,15,16,7,8, 12,15,16,7,8,
			// part B
			10,24,25,22,23, 12,24,25,22,23,
			// part C
			0,1,26,3,27, 1,5,22,7,23, 5,9,22,7,23, 9,10,22,7,23, 11,12,22,7,23,
			10,13,24,15,25, 12,17,24,15,25, 10,18,28,20,29,
			10,15,25,7,23, 12,15,25,7,23,
			// part D
 			10,24,16,22,8, 12,24,16,22,8
		],
		[	// centIdx: 各四面体が属する五胞体を示すindex
			// part A
			0,0,0,0,0, 1,1,1,1,1, 2,2,2,2,2, 3,3,3,3,3, 4,4,4,4,4,
			5,5,5,5,5, 6,6,6,6,6, 7,7,7,7,7, 8,8,8,8,8, 9,9,9,9,9,
			// part B
			10,10,10,10,10, 11,11,11,11,11, 
			// part C
			12,12,12,12,12, 13,13,13,13,13, 14,14,14,14,14, 15,15,15,15,15, 16,16,16,16,16, 
			17,17,17,17,17, 18,18,18,18,18, 19,19,19,19,19, 20,20,20,20,20, 21,21,21,21,21, 
			// part D
			22,22,22,22,22, 23,23,23,23,23
		],
		[ 0,2.2,0.9,0 ],							// offs: vertex生成時位置オフセット
		[ 0.0, -Math.PI/4, 0.0, 0.0, 0.0, 0.0 ]		// rot:  vertex生成時回転
	);
	PhoenixHead.setTriBuffer( TriBuffer );
	
	// 彫像胴部の生成
	PhoenixBody = new fDWL.R4D.Pylams4D(
		gl,
		triangleShader.prg,
		[ 0,Phoenix_OffsY,-5,Phoenix_OffsH ],							// pos
		PhoenixRotate,										// rotate
		[ PhoenixBody_SCALE, PhoenixBody_SCALE, PhoenixBody_SCALE, PhoenixBody_SCALE ],
		[	// vertex
			0,14,22,0,  0,12,14,0,  0,8,13,0,  4,8,13,0,  0,8,13,4, 			// 0-4
			0,5,15,0,   3,5,15,0,   0,5,15,3,  0,4,16,0,  0,2,6,0,				// 5-9
			0,1.6,4,0,  0,1.2,4,0,  2,0,0,0,   -4,8,13,0, 0,8,13,-4, 			// 10-14
			-3,5,15,0,  0,5,15,-3,  0,0,0,2,   -2,0,0,0,  0,0,0,-2,				// 15-19
			0,10,16,0,  0,10,14,0,  											// 20-21
			0,9,14,2,   2,9,14,0,   0,9,14,-2,  -2,9,14,0,						// 22-25
			12,15,16,0, 0,15,16,12, -12,15,16,0, 0,15,16,-12,					// 26-29:wingtop
			0,2.2,7,0,															// 30:tail
			0,6,14,0,   1,6,16,0,   2,6,14,0,   0,6,16,2,   2,2,13,0,			// 31-35:legL
			0,6,14,0,  -1,6,16,0,  -2,6,14,0,   0,6,16,-2, -2,2,13,0,			// 36-40:legR
			0,6,14,0,   0,6,16,1,   0,6,14,2,   2,6,16,0,   0,2,13,2,			// 41-45:legHL
			0,6,14,0,   0,6,16,-1,  0,6,14,-2, -2,6,16,0,   0,2,13,-2,			// 46-50:legHR
			9.6,14,15.6,0, 9.6,13.6,15.3,0, 9.6,13.8,15.2,0.4, 16,13,6,0, 		// 51-54:1st featherL
			-9.6,14,15.6,0, -9.6,13.6,15.3,0, -9.6,13.8,15.2,0.4, -16,13,6,0, 	// 55-58:1st featherR
			0,14,15.6,9.6, 0,13.6,15.3,9.6, 0.4,13.8,15.2,9.6, 0,13,6,16, 		// 59-62:1st featherHL
			0,14,15.6,-9.6, 0,13.6,15.3,-9.6, 0.4,13.8,15.2,-9.6, 0,13,6,-16, 	// 63-66:1st featherHR
			13,9,2,0, 9.6,14,15.6,0, 7.2,13,15.2,0, 7.2,12.2,14.8,0, 7.2,12.6,15.2,0.8, 		// 67-71:2nd ftrL
			-13,9,2,0, -9.6,14,15.6,0, -7.2,13,15.2,0, -7.2,12.2,14.8,0, -7.2,12.6,15.2,0.8, 	// 72-76:2nd ftrR
			0,9,2, 13, 0,14,15.6, 9.6, 0,13,15.2, 7.2, 0,12.2,14.8, 7.2, 0.8,12.6,15.2,7.2, 	// 77-81:2nd ftrHL
			0,9,2,-13, 0,14,15.6,-9.6, 0,13,15.2,-7.2, 0,12.2,14.8,-7.2, 0.8,12.6,15.2,-7.2, 	// 82-86:2nd ftrHR
			10,7,5,0, 7.2,13,15.2,0, 5.0,12,14.8,0, 5.0,10.8,14.2,0, 5.0,11.4,14.8,1.2, 		// 87-91:3rd ftrL
			-10,7,5,0, -7.2,13,15.2,0, -5.0,12,14.8,0, -5.0,10.8,14.2,0, -5.0,11.4,14.8,1.2, 	// 92-96:3rd ftrR
			0,7,5,10, 0,13,15.2,7.2, 0,12,14.8,5.0, 0,10.8,14.2,5.0, 1.2,11.4,14.8,5.0, 		// 97-101:3rd ftrHL
			0,7,5,-10, 0,13,15.2,-7.2, 0,12,14.8,-5.0, 0,10.8,14.2,-5.0, -1.2,11.4,14.8,-5.0, 	// 102-106:3rd ftrHL
			 7,4,8,0,  5.0,12,14.8,0,  3.0,11,14.2,0,  3.0,10,14,0,  3.0,10.2,14.2,1.6, 		// 107-111:4th ftrL
			-7,4,8,0, -5.0,12,14.8,0, -3.0,11,14.2,0, -3.0,10,14,0, -3.0,10.2,14.2,1.6, 		// 112-116:4th ftrR
			0,4,8, 7, 0,12,14.8, 5.0, 0,11,14.2, 3.0, 0,10,14, 3.0,  1.6,10.2,14.2, 3.0, 		// 117-121:4th ftrHL
			0,4,8,-7, 0,12,14.8,-5.0, 0,11,14.2,-3.0, 0,10,14,-3.0, -1.6,10.2,14.2,-3.0, 		// 122-126:4th ftrHR
		],
		[	// color: 20(1つの五胞体)ごとに一単位
			220,64,64,255, 220,64,64,255, 220,64,64,255, 220,64,64,255,
			220,64,64,255, 220,64,64,255, 220,64,64,255, 220,64,64,255,
			220,64,64,255, 220,64,64,255, 220,64,64,255, 220,64,64,255,
			220,64,64,255, 220,64,64,255, 220,64,64,255, 220,64,64,255,
			220,64,64,255, 220,64,64,255, 220,64,64,255, 220,64,64,255,
			220,64,64,255, 220,64,64,255, 220,64,64,255, 220,64,64,255,
			220,64,64,255, 220,64,64,255, 220,64,64,255, 220,64,64,255,
			220,64,64,255, 220,64,64,255, 220,64,64,255, 220,64,64,255,
			220,64,64,255, 220,64,64,255, 220,64,64,255, 220,64,64,255,
			220,64,64,255, 220,64,64,255, 220,64,64,255, 220,64,64,255,
			220,64,64,255, 220,64,64,255, 220,64,64,255, 220,64,64,255,
		],
		[	// index of pylamids
			0, 1, 3,13, 0, 1, 3, 4, 0, 1,13, 4, 0, 3,13, 4,  1, 3,13, 4, 
			0, 1, 3,13, 0, 1, 3,14, 0, 1,13,14, 0, 3,13,14,  1, 3,13,14, 
			0, 3, 4, 6, 0, 3, 4, 7, 0, 3, 6, 7, 0, 4, 6, 7,  3, 4, 6, 7, 
			0, 3,14, 6, 0, 3,14,16, 0, 3, 6,16, 0,14, 6,16,  3,14, 6,16, 
			0,13, 4,15, 0,13, 4, 7, 0,13,15, 7, 0, 4,15, 7, 13, 4,15, 7, 
			0,13,14,15, 0,13,14,16, 0,13,15,16, 0,14,15,16, 13,14,15,16, 
			0, 8, 6,15, 0, 8, 6, 7, 0, 8,15, 7, 0, 6,15, 7,  8, 6,15, 7, 
			0, 8, 6,15, 0, 8, 6,16, 0, 8,15,16, 0, 6,15,16,  8, 6,15,16, 
			9, 1, 3,13, 9, 1, 3, 4, 9, 1,13, 4, 9, 3,13, 4,  1, 3,13, 4, 
			9, 1, 3,13, 9, 1, 3,14, 9, 1,13,14, 9, 3,13,14,  1, 3,13,14, 
			9, 3, 4, 6, 9, 3, 4, 7, 9, 3, 6, 7, 9, 4, 6, 7,  3, 4, 6, 7, 
			9, 3,14, 6, 9, 3,14,16, 9, 3, 6,16, 9,14, 6,16,  3,14, 6,16, 
			9,13, 4,15, 9,13, 4, 7, 9,13,15, 7, 9, 4,15, 7, 13, 4,15, 7, 
			9,13,14,15, 9,13,14,16, 9,13,15,16, 9,14,15,16, 13,14,15,16, 
			9, 8, 6,15, 9, 8, 6, 7, 9, 8,15, 7, 9, 6,15, 7,  8, 6,15, 7, 
			9, 8, 6,15, 9, 8, 6,16, 9, 8,15,16, 9, 6,15,16,  8, 6,15,16,
			30,10,11,12, 30,10,11,17, 30,10,12,17, 30,11,12,17, 10,11,12,17, 
			30,10,11,18, 30,10,11,17, 30,10,18,17, 30,11,18,17, 10,11,18,17, 
			30,10,11,12, 30,10,11,19, 30,10,12,19, 30,11,12,19, 10,11,12,19, 
			30,10,11,18, 30,10,11,19, 30,10,18,19, 30,11,18,19, 10,11,18,19, 
			20,21,2,22, 20,21,2,26, 20,21,22,26, 20,2,22,26, 21,2,22,26, 		// wing
			20,21,2,23, 20,21,2,27, 20,21,23,27, 20,2,23,27, 21,2,23,27, 
			20,21,2,24, 20,21,2,28, 20,21,24,28, 20,2,24,28, 21,2,24,28, 
			20,21,2,25, 20,21,2,29, 20,21,25,29, 20,2,25,29, 21,2,25,29, 
			31,32,33,34, 31,32,33,35, 31,32,34,35, 31,33,34,35, 32,33,34,35, 	// leg
			36,37,38,39, 36,37,38,40, 36,37,39,40, 36,38,39,40, 37,38,39,40, 
			41,42,43,44, 41,42,43,45, 41,42,44,45, 41,43,44,45, 42,43,44,45, 
			46,47,48,49, 46,47,48,50, 46,47,49,50, 46,48,49,50, 47,48,49,50, 
			26,51,52,53, 26,51,52,54, 26,51,53,54, 26,52,53,54, 51,52,53,54, 	// feather 1st
			28,55,56,57, 28,55,56,58, 28,55,57,58, 28,56,57,58, 55,56,57,58, 
			27,59,60,61, 27,59,60,62, 27,59,61,62, 27,60,61,62, 59,60,61,62, 
			29,63,64,65, 29,63,64,66, 29,63,65,66, 29,64,65,66, 63,64,65,66, 
			67,68,69,70, 67,68,69,71, 67,68,70,71, 67,69,70,71, 68,69,70,71, 	// feather 2nd
			72,73,74,75, 72,73,74,76, 72,73,75,76, 72,74,75,76, 73,74,75,76, 
			77,78,79,80, 77,78,79,81, 77,78,80,81, 77,79,80,81, 78,79,80,81, 
			82,83,84,85, 82,83,84,86, 82,83,85,86, 82,84,85,86, 83,84,85,86, 
			87,88,89,90, 87,88,89,91, 87,88,90,91, 87,89,90,91, 88,89,90,91, 	// feather 3rd
			92,93,94,95, 92,93,94,96, 92,93,95,96, 92,94,95,96, 93,94,95,96, 
			97,98,99,100, 97,98,99,101, 97,98,100,101, 97,99,100,101, 98,99,100,101, 
			102,103,104,105, 102,103,104,106, 102,103,105,106, 102,104,105,106, 103,104,105,106, 
			107,108,109,110, 107,108,109,111, 107,108,110,111, 107,109,110,111, 108,109,110,111,  	// feather 4th
			112,113,114,115, 112,113,114,116, 112,113,115,116, 112,114,115,116, 113,114,115,116, 
			117,118,119,120, 117,118,119,121, 117,118,120,121, 117,119,120,121, 118,119,120,121, 
			122,123,124,125, 122,123,124,126, 122,123,125,126, 122,124,125,126, 123,124,125,126, 
		],
		[	// chrnIdx: 各五胞体の構成頂点index
			0,1,3,13,4, 0,1,3,13,14, 0,3,4,6,7, 0,3,14,6,16, 0,13,4,15,7, 0,13,14,15,16, 0,8,6,15,7, 0,8,6,15,16, 
			9,1,3,13,4, 9,1,3,13,14, 9,3,4,6,7, 9,3,14,6,16, 9,13,4,15,7, 9,13,14,15,16, 9,8,6,15,7, 9,8,6,15,16, 
			30,10,11,12,17, 30,10,11,18,17, 30,10,11,12,19, 30,10,11,18,19,
			20,21,2,22,26,  20,21,2,23,27,  20,21,2,24,28,  20,21, 2,25,29, 			// WingLhLRhR
			31,32,33,34,35, 36,37,38,39,40, 41,42,43,44,45, 46,47,48,49,50, 			// legLRhLhR
			26,51,52,53,54, 28,55,56,57,58, 27,59,60,61,62, 29,63,64,65,66, 			// feather
			67,68,69,70,71, 72,73,74,75,76, 77,78,79,80,81, 82,83,84,85,86, 
			87,88,89,90,91, 92,93,94,95,96, 97,98,99,100,101, 102,103,104,105,106, 
			107,108,109,110,111, 112,113,114,115,116, 117,118,119,120,121, 122,123,124,125,126, 
		],
		[	// centIdx: 各四面体が属する五胞体を示すindex
			0,0,0,0,0, 1,1,1,1,1, 2,2,2,2,2, 3,3,3,3,3, 
			4,4,4,4,4, 5,5,5,5,5, 6,6,6,6,6, 7,7,7,7,7, 
			8,8,8,8,8, 9,9,9,9,9, 10,10,10,10,10, 11,11,11,11,11, 
			12,12,12,12,12, 13,13,13,13,13, 14,14,14,14,14, 15,15,15,15,15, 
			16,16,16,16,16, 17,17,17,17,17, 18,18,18,18,18, 19,19,19,19,19, 
			20,20,20,20,20, 21,21,21,21,21, 22,22,22,22,22, 23,23,23,23,23, 
			24,24,24,24,24, 25,25,25,25,25, 26,26,26,26,26, 27,27,27,27,27, 
			28,28,28,28,28, 29,29,29,29,29, 30,30,30,30,30, 31,31,31,31,31, 
			32,32,32,32,32, 33,33,33,33,33, 34,34,34,34,34, 35,35,35,35,35, 
			36,36,36,36,36, 37,37,37,37,37, 38,38,38,38,38, 39,39,39,39,39, 
			40,40,40,40,40, 41,41,41,41,41, 42,42,42,42,42, 43,43,43,43,43,
		],
		[ 0,0,-3.4,0 ],							// offs: vertex生成時位置オフセット
		[ 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 ]		// rot:  vertex生成時回転
	);
	PhoenixBody.setTriBuffer( TriBuffer );
	
	// 彫像脚部の生成
	(function(){
		var idx = 0,
			pos = [ 0,Phoenix_OffsY,-5,Phoenix_OffsH ],
			//rot = [ 0,0,0,0,0,Math.PI ]
			locZ = -0.8,
			colors = [
				220,64,64,255, 220,64,64,255, 220,64,64,255, 220,64,64,255,
				220,64,64,255, 220,64,64,255, 220,220,64,255, 220,220,64,255,
				220,64,64,255, 220,64,64,255, 220,220,64,255, 220,220,64,255,
				220,64,64,255, 220,64,64,255, 220,220,64,255, 220,220,64,255,
				220,64,64,255, 220,64,64,255, 220,220,64,255, 220,220,64,255,
			],
			pylamIdx = [
				0,1,2,3, 0,1,2,4, 0,1,3,4, 0,2,3,4, 1,2,3,4, 
				0,1,2,3, 0,1,2,5, 0,1,3,5, 0,2,3,5, 1,2,3,5, 
				6,7,8,9, 6,7,8,10, 6,7,9,10, 6,8,9,10, 7,8,9,10, 
				6,7,8,9, 6,7,8,11, 6,7,9,11, 6,8,9,11, 7,8,9,11, 
				12,13,14,15, 12,13,14,16, 12,13,15,16, 12,14,15,16, 13,14,15,16, 
				12,13,14,15, 12,13,14,17, 12,13,15,17, 12,14,15,17, 13,14,15,17, 
				18,19,20,21, 18,19,20,22, 18,19,21,22, 18,20,21,22, 19,20,21,22, 
				18,19,20,21, 18,19,20,23, 18,19,21,23, 18,20,21,23, 19,20,21,23, 
				24,25,26,27, 24,25,26,28, 24,25,27,28, 24,26,27,28, 25,26,27,28, 
				24,25,26,27, 24,25,26,29, 24,25,27,29, 24,26,27,29, 25,26,27,29, 
				30,31,32,33, 30,31,32,34, 30,31,33,34, 30,32,33,34, 31,32,33,34, 
				30,31,32,33, 30,31,32,35, 30,31,33,35, 30,32,33,35, 31,32,33,35, 
				36,37,38,39, 36,37,38,40, 36,37,39,40, 36,38,39,40, 37,38,39,40, 
				36,37,38,39, 36,37,38,41, 36,37,39,41, 36,38,39,41, 37,38,39,41, 
				42,43,44,45, 42,43,44,46, 42,43,45,46, 42,44,45,46, 43,44,45,46, 
				42,43,44,45, 42,43,44,47, 42,43,45,47, 42,44,45,47, 43,44,45,47, 
				48,49,50,51, 48,49,50,52, 48,49,51,52, 48,50,51,52, 49,50,51,52, 
				48,49,50,51, 48,49,50,53, 48,49,51,53, 48,50,51,53, 49,50,51,53, 
				54,55,56,57, 54,55,56,58, 54,55,57,58, 54,56,57,58, 55,56,57,58, 
				54,55,56,57, 54,55,56,59, 54,55,57,59, 54,56,57,59, 55,56,57,59, 
			],
			chrnIdx = [
			0,1,2,3,4, 0,1,2,3,5, 6,7,8,9,10, 6,7,8,9,11, 
				12,13,14,15,16, 12,13,14,15,17, 18,19,20,21,22, 18,19,20,21,23, 
				24,25,26,27,28, 24,25,26,27,29, 30,31,32,33,34, 30,31,32,33,35, 
				36,37,38,39,40, 36,37,38,39,41, 42,43,44,45,46, 42,43,44,45,47, 
				48,49,50,51,52, 48,49,50,51,53, 54,55,56,57,58, 54,55,56,57,59, 
			],
			centIdx = [
				0,0,0,0,0, 1,1,1,1,1, 2,2,2,2,2, 3,3,3,3,3, 
				4,4,4,4,4, 5,5,5,5,5, 6,6,6,6,6, 7,7,7,7,7, 
				8,8,8,8,8, 9,9,9,9,9, 10,10,10,10,10, 11,11,11,11,11,
				12,12,12,12,12, 13,13,13,13,13, 14,14,14,14,14, 15,15,15,15,15, 
				16,16,16,16,16, 17,17,17,17,17, 18,18,18,18,18, 19,19,19,19,19, 
			];
		
		PhoenixFoot[0] = new fDWL.R4D.Pylams4D(
			gl,
			triangleShader.prg,
			pos,		// pos
			PhoenixRotate,		// rotate
			[ PhoenixFoot_SCALE, PhoenixFoot_SCALE, PhoenixFoot_SCALE, PhoenixFoot_SCALE ],
			[	// vertex
				0,2,0,0, 0,0,3,0, 0.5,3,0,0, -0.5,3,0,0, 0,3,0,0.5, 0,3,0,-0.5,				// 0-5
				0,0,4,0, 0,3,0,0,   1,0,3,0,   -1,0,3,0, 0,0,3,1,   0,0,3,-1,				// 6-11
				0,1,2,0, 0,0,1,0,   1,0,3,0,   -1,0,3,0, 0,0,3,1,   0,0,3,-1,				// 12-17
				0,0,0,0, 0,0.5,2.5,0, 0.5,0,3,0, -0.5,0,3,0, 0,0,3,0.5, 0,0,3,-0.5,			// 18-23
				0,0,3,0, 0,1,5,0, 0.4,0.2,5,0, -0.4,0.2,5,0, 0,0.2,5,0.4, 0,0.2,5,-0.4,		// 24-29
				0,0,7,0, 0,1,5,0, 0.4,0.2,5,0, -0.4,0.2,5,0, 0,0.2,5,0.4, 0,0.2,5,-0.4,		// 30-35
				0.6,0,3,0, 1,1,5,0, 1.4,0.2,5,0, 0.6,0.2,5,0, 1,0.2,5,0.4, 1,0.2,5,-0.4,	// 36-41
				1,0,7,0, 1,1,5,0, 1.4,0.2,5,0, 0.6,0.2,5,0, 1,0.2,5,0.4, 1,0.2,5,-0.4,		// 42-47
				-0.6,0,3,0, -1,1,5,0, -1.4,0.2,5,0, -0.6,0.2,5,0, -1,0.2,5,0.4, -1,0.2,5,-0.4,	// 48-53
				-1,0,7,0, -1,1,5,0, -1.4,0.2,5,0, -0.6,0.2,5,0, -1,0.2,5,0.4, -1,0.2,5,-0.4,	// 54-59
			],
			colors,
			pylamIdx,
			chrnIdx,
			centIdx,
			[ 0.35,0,locZ,0 ],							// offs: vertex生成時位置オフセット
			[ 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 ]		// rot:  vertex生成時回転
		);
		PhoenixFoot[1] = new fDWL.R4D.Pylams4D(
			gl,
			triangleShader.prg,
			pos,		// pos
			PhoenixRotate,		// rotate
			[ PhoenixFoot_SCALE, PhoenixFoot_SCALE, PhoenixFoot_SCALE, PhoenixFoot_SCALE ],
			[	// vertex
				0,2,0,0, 0,0,3,0, 0.5,3,0,0, -0.5,3,0,0, 0,3,0,0.5, 0,3,0,-0.5,				// 0-5
				0,0,4,0, 0,3,0,0,   1,0,3,0,   -1,0,3,0, 0,0,3,1,   0,0,3,-1,				// 6-11
				0,1,2,0, 0,0,1,0,   1,0,3,0,   -1,0,3,0, 0,0,3,1,   0,0,3,-1,				// 12-17
				0,0,0,0, 0,0.5,2.5,0, 0.5,0,3,0, -0.5,0,3,0, 0,0,3,0.5, 0,0,3,-0.5,			// 18-23
				0,0,3,0, 0,1,5,0, 0.4,0.2,5,0, -0.4,0.2,5,0, 0,0.2,5,0.4, 0,0.2,5,-0.4,		// 24-29
				0,0,7,0, 0,1,5,0, 0.4,0.2,5,0, -0.4,0.2,5,0, 0,0.2,5,0.4, 0,0.2,5,-0.4,		// 30-35
				0.6,0,3,0, 1,1,5,0, 1.4,0.2,5,0, 0.6,0.2,5,0, 1,0.2,5,0.4, 1,0.2,5,-0.4,	// 36-41
				1,0,7,0, 1,1,5,0, 1.4,0.2,5,0, 0.6,0.2,5,0, 1,0.2,5,0.4, 1,0.2,5,-0.4,		// 42-47
				-0.6,0,3,0, -1,1,5,0, -1.4,0.2,5,0, -0.6,0.2,5,0, -1,0.2,5,0.4, -1,0.2,5,-0.4,	// 48-53
				-1,0,7,0, -1,1,5,0, -1.4,0.2,5,0, -0.6,0.2,5,0, -1,0.2,5,0.4, -1,0.2,5,-0.4,	// 54-59
			],
			colors,
			pylamIdx,
			chrnIdx,
			centIdx,
			[ -0.35,0,locZ,0 ],							// offs: vertex生成時位置オフセット
			[ 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 ]		// rot:  vertex生成時回転
		);
		PhoenixFoot[2] = new fDWL.R4D.Pylams4D(
			gl,
			triangleShader.prg,
			pos,		// pos
			PhoenixRotate,		// rotate
			[ PhoenixFoot_SCALE, PhoenixFoot_SCALE, PhoenixFoot_SCALE, PhoenixFoot_SCALE ],
			[	// vertex
				0,2,0,0, 0,0,3,0, 0.5,3,0,0, -0.5,3,0,0, 0,3,0,0.5, 0,3,0,-0.5,				// 0-5
				0,0,4,0, 0,3,0,0,   1,0,3,0,   -1,0,3,0, 0,0,3,1,   0,0,3,-1,				// 6-11
				0,1,2,0, 0,0,1,0,   1,0,3,0,   -1,0,3,0, 0,0,3,1,   0,0,3,-1,				// 12-17
				0,0,0,0, 0,0.5,2.5,0, 0.5,0,3,0, -0.5,0,3,0, 0,0,3,0.5, 0,0,3,-0.5,			// 18-23
				0,0,3,0, 0,1,5,0, 0.4,0.2,5,0, -0.4,0.2,5,0, 0,0.2,5,0.4, 0,0.2,5,-0.4,		// 24-29
				0,0,7,0, 0,1,5,0, 0.4,0.2,5,0, -0.4,0.2,5,0, 0,0.2,5,0.4, 0,0.2,5,-0.4,		// 30-35
				0.6,0,3,0, 1,1,5,0, 1.4,0.2,5,0, 0.6,0.2,5,0, 1,0.2,5,0.4, 1,0.2,5,-0.4,	// 36-41
				1,0,7,0, 1,1,5,0, 1.4,0.2,5,0, 0.6,0.2,5,0, 1,0.2,5,0.4, 1,0.2,5,-0.4,		// 42-47
				-0.6,0,3,0, -1,1,5,0, -1.4,0.2,5,0, -0.6,0.2,5,0, -1,0.2,5,0.4, -1,0.2,5,-0.4,	// 48-53
				-1,0,7,0, -1,1,5,0, -1.4,0.2,5,0, -0.6,0.2,5,0, -1,0.2,5,0.4, -1,0.2,5,-0.4,	// 54-59
			],
			colors,
			pylamIdx,
			chrnIdx,
			centIdx,
			[ 0,0,locZ,0.35 ],							// offs: vertex生成時位置オフセット
			[ 0.0, 0.0, 0.0, 0.0, Math.PI/2, 0.0 ]		// rot:  vertex生成時回転
		);
		PhoenixFoot[3] = new fDWL.R4D.Pylams4D(
			gl,
			triangleShader.prg,
			pos,		// pos
			PhoenixRotate,		// rotate
			[ PhoenixFoot_SCALE, PhoenixFoot_SCALE, PhoenixFoot_SCALE, PhoenixFoot_SCALE ],
			[	// vertex
				0,2,0,0, 0,0,3,0, 0.5,3,0,0, -0.5,3,0,0, 0,3,0,0.5, 0,3,0,-0.5,				// 0-5
				0,0,4,0, 0,3,0,0,   1,0,3,0,   -1,0,3,0, 0,0,3,1,   0,0,3,-1,				// 6-11
				0,1,2,0, 0,0,1,0,   1,0,3,0,   -1,0,3,0, 0,0,3,1,   0,0,3,-1,				// 12-17
				0,0,0,0, 0,0.5,2.5,0, 0.5,0,3,0, -0.5,0,3,0, 0,0,3,0.5, 0,0,3,-0.5,			// 18-23
				0,0,3,0, 0,1,5,0, 0.4,0.2,5,0, -0.4,0.2,5,0, 0,0.2,5,0.4, 0,0.2,5,-0.4,		// 24-29
				0,0,7,0, 0,1,5,0, 0.4,0.2,5,0, -0.4,0.2,5,0, 0,0.2,5,0.4, 0,0.2,5,-0.4,		// 30-35
				0.6,0,3,0, 1,1,5,0, 1.4,0.2,5,0, 0.6,0.2,5,0, 1,0.2,5,0.4, 1,0.2,5,-0.4,	// 36-41
				1,0,7,0, 1,1,5,0, 1.4,0.2,5,0, 0.6,0.2,5,0, 1,0.2,5,0.4, 1,0.2,5,-0.4,		// 42-47
				-0.6,0,3,0, -1,1,5,0, -1.4,0.2,5,0, -0.6,0.2,5,0, -1,0.2,5,0.4, -1,0.2,5,-0.4,	// 48-53
				-1,0,7,0, -1,1,5,0, -1.4,0.2,5,0, -0.6,0.2,5,0, -1,0.2,5,0.4, -1,0.2,5,-0.4,	// 54-59
			],
			colors,
			pylamIdx,
			chrnIdx,
			centIdx,
			[ 0,0,locZ,-0.35 ],							// offs: vertex生成時位置オフセット
			[ 0.0, 0.0, 0.0, 0.0, -Math.PI/2, 0.0 ]		// rot:  vertex生成時回転
		);
		PhoenixFoot[0].setTriBuffer( TriBuffer );
		PhoenixFoot[1].setTriBuffer( TriBuffer );
		PhoenixFoot[2].setTriBuffer( TriBuffer );
		PhoenixFoot[3].setTriBuffer( TriBuffer );
	}());
	
	// Field4Dの生成
	fieldCenter = [ -FIELD_OFFS*1.5, 0, -FIELD_OFFS*2 ];
	Field4D[0] = (function( Field4D ){
		var widthX = FIELD_WIDTH_X,
			widthZ = FIELD_WIDTH_Z,
			Field4D = new fDWL.D4D.Field( gl, fieldCenter, [ 0.0, 0.0, 0.0 ], [ widthX, widthZ ], FIELD_SCALE, FIELD_SCALE ),
			baseVtx = Field4D.getBaseVtx(),
			iField0 = {},
			iField1 = {},
			iField2 = {},
			iField3 = {},
			iField4 = {},
			iField5 = {},
			iField6 = {},
			iField7 = {},
			ifCnt = 0;
		
		// I-Fieldの生成と登録
		iField0 = new fDWL.D4D.IField( ifCnt );
		iField0.setAllColor( [1.0, 1.0, 1.0, 1.0], widthX*widthZ );
		Field4D.setIField( iField0 );
		
		ifCnt++;
		iField1 = new fDWL.D4D.IField( ifCnt );
		iField1.setAllColor( [1.0, 1.0, 1.0, 1.0], widthX*widthZ );
		Field4D.setIField( iField1 );
		
		ifCnt++;
		iField2 = new fDWL.D4D.IField( ifCnt );
		iField2.setAllColor( [1.0, 1.0, 1.0, 1.0], widthX*widthZ );
		Field4D.setIField( iField2 );
		
		ifCnt++;
		iField3 = new fDWL.D4D.IField( ifCnt );
		iField3.setAllColor( [1.0, 1.0, 1.0, 1.0], widthX*widthZ );
		Field4D.setIField( iField3 );
		
		ifCnt++;
		iField4 = new fDWL.D4D.IField( ifCnt );
		iField4.setAllColor( [1.0, 1.0, 1.0, 1.0], widthX*widthZ );
		Field4D.setIField( iField4 );
		
		ifCnt++;
		iField5 = new fDWL.D4D.IField( ifCnt );
		iField5.setAllColor( [1.0, 1.0, 1.0, 1.0], widthX*widthZ );
		Field4D.setIField( iField5 );
		
		ifCnt++;
		iField6 = new fDWL.D4D.IField( ifCnt );
		iField6.setAllColor( [1.0, 1.0, 1.0, 1.0], widthX*widthZ );
		Field4D.setIField( iField6 );
		
		ifCnt++;
		iField7 = new fDWL.D4D.IField( ifCnt );
		iField7.setAllColor( [1.0, 1.0, 1.0, 1.0], widthX*widthZ );
		Field4D.setIField( iField7 );
		
		return Field4D;
	}( Field4D[0] ));
	Field4D[ 1] = Field4D[0].clone( [ -FIELD_OFFS*0.5, 0, -FIELD_OFFS*2 ], [ 0.0, 0, 0.0 ] );
	Field4D[ 2] = Field4D[0].clone( [  FIELD_OFFS*0.5, 0, -FIELD_OFFS*2 ], [ 0.0, 0, 0.0 ] );
	Field4D[ 3] = Field4D[0].clone( [ -FIELD_OFFS*1.5, 0, -FIELD_OFFS   ], [ 0.0, 0, 0.0 ] );
	Field4D[ 4] = Field4D[0].clone( [ -FIELD_OFFS*0.5, 0, -FIELD_OFFS   ], [ 0.0, 0, 0.0 ] );
	Field4D[ 5] = Field4D[0].clone( [  FIELD_OFFS*0.5, 0, -FIELD_OFFS   ], [ 0.0, 0, 0.0 ] );
	Field4D[ 6] = Field4D[0].clone( [ -FIELD_OFFS*1.5, 0,  0            ], [ 0.0, 0, 0.0 ] );
	Field4D[ 7] = Field4D[0].clone( [ -FIELD_OFFS*0.5, 0,  0            ], [ 0.0, 0, 0.0 ] );
	Field4D[ 8] = Field4D[0].clone( [  FIELD_OFFS*0.5, 0,  0            ], [ 0.0, 0, 0.0 ] );
	Field4D[ 9] = Field4D[0].clone( [ -FIELD_OFFS*1.5, 0,  FIELD_OFFS   ], [ 0.0, 0, 0.0 ] );
	Field4D[10] = Field4D[0].clone( [ -FIELD_OFFS*0.5, 0,  FIELD_OFFS   ], [ 0.0, 0, 0.0 ] );
	
	(function(){
		var iFldArray = {},
			iFld = {},
			widthX = FIELD_WIDTH_X,
			widthZ = FIELD_WIDTH_Z,
			idx = 0;
		
		iFldArray =  Field4D[0].getIField();
		for( idx in iFldArray ){
			iFld = iFldArray[idx];
			iFld.setVertex( [
				0.0, 4.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 4.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 3.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 3.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 3.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 3.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 3.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 3.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 3.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 0.8, 0.0,  0.0, 0.8, 0.0,  0.0, 0.8, 0.0,  0.0, 0.0, 0.0,
			] );
			iFld.makeNormal( widthX, widthZ, Field4D[0].getBaseVtx(), false );
		}
		Field4D[0].switchCellDir( 28 );
		Field4D[0].switchCellDir( 86 );
		Field4D[0].resetIbo();
		
		iFldArray =  Field4D[1].getIField();
		for( idx in iFldArray ){
			iFld = iFldArray[idx];
			iFld.setVertex( [
				0.0, 2.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
			] );
			iFld.makeNormal( widthX, widthZ, Field4D[1].getBaseVtx(), false );
		}
		Field4D[1].switchCellDir( 63 );
		Field4D[1].resetIbo();
		
		iFldArray =  Field4D[2].getIField();
		for( idx in iFldArray ){
			iFld = iFldArray[idx];
			iFld.setVertex( [
				0.0, 3.0, 0.0,  0.0, 3.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 3.0, 0.0,  0.0, 3.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 3.0, 0.0,
				0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 3.0, 0.0,
				0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 3.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 3.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 3.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 3.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 3.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0,-0.2, 0.0,  0.0,-0.2, 0.0,  0.0,-0.2, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0
			] );
			iFld.makeNormal( widthX, widthZ, Field4D[2].getBaseVtx(), false );
		}
		Field4D[2].switchCellDir( 43 );
		Field4D[2].switchCellDir( 54 );
		Field4D[2].switchCellDir( 62 );
		Field4D[2].switchCellDir( 65 );
		Field4D[2].switchCellDir( 73 );
		Field4D[2].resetIbo();
		
		iFldArray =  Field4D[3].getIField();
		for( idx in iFldArray ){
			iFld = iFldArray[idx];
			iFld.setVertex( [
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 0.8, 0.0,  0.0, 0.8, 0.0,  0.0, 0.8, 0.0,  0.0, 0.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 0.9, 0.0,  0.0, 0.9, 0.0,  0.0, 0.9, 0.0,  0.0, 2.0, 0.0,  0.0, 0.6, 0.0,  0.0, 0.6, 0.0,  0.0, 0.6, 0.0,  0.0, 0.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 0.8, 0.0,  0.0, 0.8, 0.0,  0.0, 0.8, 0.0,  0.0, 2.0, 0.0,  0.0, 0.4, 0.0,  0.0, 0.4, 0.0,  0.0, 0.4, 0.0,  0.0, 0.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 0.7, 0.0,  0.0, 0.7, 0.0,  0.0, 0.7, 0.0,  0.0, 2.0, 0.0,  0.0, 0.2, 0.0,  0.0, 0.2, 0.0,  0.0, 0.2, 0.0,  0.0, 0.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 0.6, 0.0,  0.0, 0.6, 0.0,  0.0, 0.6, 0.0,  0.0, 2.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.5, 0.0,  0.0, 0.5, 0.0,  0.0, 0.5, 0.0,  0.0, 2.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.4, 0.0,  0.0, 0.4, 0.0,  0.0, 0.4, 0.0,  0.0, 2.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.3, 0.0,  0.0, 0.3, 0.0,  0.0, 0.3, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.2, 0.0,  0.0, 0.2, 0.0,  0.0, 0.2, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.1, 0.0,  0.0, 0.1, 0.0,  0.0, 0.1, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 0.0, 0.0,
			] );
			iFld.makeNormal( widthX, widthZ, Field4D[3].getBaseVtx(), false );
		}
		Field4D[3].switchCellDir( 39 );
		Field4D[3].resetIbo();
		
		iFldArray =  Field4D[4].getIField();
		for( idx in iFldArray ){
			iFld = iFldArray[idx];
			iFld.setVertex( [
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
			] );
			iFld.makeNormal( widthX, widthZ, Field4D[4].getBaseVtx(), false );
		}
		iFldArray =  Field4D[5].getIField();
		for( idx in iFldArray ){
			iFld = iFldArray[idx];
			iFld.setVertex( [
				0.0, 0.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0,-0.2, 0.0,  0.0,-0.2, 0.0,  0.0,-0.2, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0,-0.4, 0.0,  0.0,-0.4, 0.0,  0.0,-0.4, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0,-0.6, 0.0,  0.0,-0.6, 0.0,  0.0,-0.6, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0,-0.8, 0.0,  0.0,-0.8, 0.0,  0.0,-0.8, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0,-0.8, 0.0,  0.0,-0.8, 0.0,  0.0,-0.8, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0,-0.6, 0.0,  0.0,-0.6, 0.0,  0.0,-0.6, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0,-0.4, 0.0,  0.0,-0.4, 0.0,  0.0,-0.4, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0,-0.2, 0.0,  0.0,-0.2, 0.0,  0.0,-0.2, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
			] );
			iFld.makeNormal( widthX, widthZ, Field4D[5].getBaseVtx(), false );
		}
		iFldArray =  Field4D[6].getIField();
		for( idx in iFldArray ){
			iFld = iFldArray[idx];
			if( idx != 3 ){
				iFld.setVertex( [
					0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 0.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 0.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				] );
			}else{
				iFld.setVertex( [
					0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 0.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 0.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				] );
			}
			iFld.makeNormal( widthX, widthZ, Field4D[6].getBaseVtx(), false );
		}
		// インデックス並びの調整
		Field4D[6].switchCellDir( 15 );
		Field4D[6].switchCellDir( 16 );
		Field4D[6].switchCellDir( 26 );
		Field4D[6].switchCellDir( 34 );
		Field4D[6].switchCellDir( 63 );
		Field4D[6].switchCellDir( 71 );
		Field4D[6].switchCellDir( 82 );
		Field4D[6].resetIbo();
		
		
		iFldArray =  Field4D[7].getIField();
		for( idx in iFldArray ){
			iFld = iFldArray[idx];
			iFld.setVertex( [
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
			] );
			iFld.makeNormal( widthX, widthZ, Field4D[7].getBaseVtx(), false );
		}
		Field4D[7].switchCellDir( 56 );
		Field4D[7].switchCellDir( 76 );
		Field4D[7].resetIbo();
		
		iFldArray =  Field4D[8].getIField();
		for( idx in iFldArray ){
			iFld = iFldArray[idx];
			iFld.setVertex( [
				0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0,-0.2, 0.0,  0.0,-0.2, 0.0,  0.0,-0.2, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
			] );
			iFld.makeNormal( widthX, widthZ, Field4D[8].getBaseVtx(), false );
		}
		iFldArray =  Field4D[9].getIField();
		for( idx in iFldArray ){
			iFld = iFldArray[idx];
			if( idx != 0 ){
				iFld.setVertex( [
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, -0.1, 0.0,  0.0, 0.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, -0.1, 0.0,  0.0, 0.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, -0.1, 0.0,  0.0, 0.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				] );
			}else{
				iFld.setVertex( [
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
					0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				] );
			}
			iFld.makeNormal( widthX, widthZ, Field4D[9].getBaseVtx(), false );
		}
		Field4D[9].switchCellDir( 35 );
		Field4D[9].switchCellDir( 43 );
		Field4D[9].switchCellDir( 54 );
		Field4D[9].resetIbo();
		
		iFldArray =  Field4D[10].getIField();
		for( idx in iFldArray ){
			iFld = iFldArray[idx];
			iFld.setVertex( [
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
				0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,  0.0, 2.0, 0.0,
			] );
			iFld.makeNormal( widthX, widthZ, Field4D[10].getBaseVtx(), false );
		}
		Field4D[10].switchCellDir( 32 );
		Field4D[10].resetIbo();
		
	}());
	// 変化のないフィールド設定
	Field4D[ 0].isSkipUpdate = Field4D[ 0].anotherIsSkip;
	Field4D[ 1].isSkipUpdate = Field4D[ 1].anotherIsSkip;
	Field4D[ 2].isSkipUpdate = Field4D[ 2].anotherIsSkip;
	Field4D[ 3].isSkipUpdate = Field4D[ 3].anotherIsSkip;
	Field4D[ 4].isSkipUpdate = Field4D[ 4].anotherIsSkip;
	Field4D[ 5].isSkipUpdate = Field4D[ 5].anotherIsSkip;
	Field4D[ 7].isSkipUpdate = Field4D[ 7].anotherIsSkip;
	Field4D[ 8].isSkipUpdate = Field4D[ 8].anotherIsSkip;
	Field4D[10].isSkipUpdate = Field4D[10].anotherIsSkip;
	
	// テクスチャ設定
	for( cnt in Field4D ){
		Field4D[cnt].setTextures( texBuf );
	}
	
	// テクスチャ座標修正
	(function(){
		var idx = 0,
			offsX = 0.0,
			offsY = 0.0,
			sizeX = 16/1024,
			sizeY = 16/1024,
			clm = 0,
			row = 0;
		
		for( idx = 0; idx < 11; ++idx ){
			offsX = clm*160/1024;
			offsY = row*160/1024;
			Field4D[idx].modifyTexture( [ offsX, offsY ], [ sizeX, sizeY ] );
			
			clm++;
			if( clm >= 3 ){
				clm = 0;
				row++;
			}
		}
	}());
	
	
	// 注視点表示
	(function(){
		var data = [],
			dataType = [ gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN, gl.TRIANGLE_FAN ],
			idx = 0,
			id2 = 0,
			offsY = 0;
		data[0] = fDWL.cylinder( 8, 0.2, 0.5, [ 1.0, 1.0, 1.0, 1.0],  [ 0, 0, 0 ], [ 0, 0, Math.PI/2 ] );
		// 円柱：テクスチャ設定
		for( idx = 0; idx < data[0].t.length; idx += 4 ){
			offsY = idx*2 + 657;
			while( offsY >= 672 ){
				offsY -= 16;
			}
			offsY /= 1024;
			data[0].t[idx  ] = 32/1024;
			data[0].t[idx+1] = offsY;
			data[0].t[idx+2] = 48/1024;
			data[0].t[idx+3] = offsY;
		}
		data[1] = fDWL.corn( 8, 0.2, 0.5, [ 1.0, 1.0, 1.0, 1.0], 1.0, [ 0,  0.1, 0 ], [ 0, 0, Math.PI/2 ] );
		data[2] = fDWL.corn( 8, 0.2, 0.5, [ 1.0, 1.0, 1.0, 1.0], 1.0, [ 0,  0.1, 0 ], [ 0, 0, Math.PI*3/2 ] );
		// 円錐：テクスチャ設定
		for( id2 = 1; id2 <= 2; ++id2 ){
			for( idx = 0; idx < data[id2].t.length; idx += 2 ){
				data[id2].t[idx  ] *= 31/1024;
				data[id2].t[idx+1] = (data[id2].t[idx+1]*32 + 656)/1024;
			}
		}
		Roller = new fDWL.Objs3D( gl, [ 0, 0, 0 ], [ 0, 0, 0 ], [ 1, 1, 1 ], data, dataType );
		Roller.height = 0.5;
	}());

	// 神殿下部
	(function(){
		var data = [],
			dataType = [ gl.TRIANGLES, gl.TRIANGLES, gl.TRIANGLES, gl.TRIANGLES, gl.TRIANGLES, gl.TRIANGLES, gl.TRIANGLES,
						 gl.TRIANGLE_FAN, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN, gl.TRIANGLE_STRIP ],
			idx = 0,
			offsY = 0,
			flrOffs = [],
			flrVtx = [];
		data[0] = fDWL.cube( [   -3, 0.5, -12.5 ], 1, [ 4, 1,  1 ], [ 1, 1, 1, 1 ], false );
		data[0].t = [
			160/1024, 112/1024, 224/1024, 112/1024, 224/1024, 128/1024, 160/1024, 128/1024, 
			160/1024, 112/1024, 176/1024, 112/1024, 176/1024, 176/1024, 160/1024, 176/1024, 
			160/1024, 112/1024, 176/1024, 112/1024, 176/1024, 176/1024, 160/1024, 176/1024, 
			160/1024, 112/1024, 224/1024, 112/1024, 224/1024, 128/1024, 160/1024, 128/1024, 
			160/1024, 112/1024, 176/1024, 112/1024, 176/1024, 128/1024, 160/1024, 128/1024, 
			160/1024, 112/1024, 176/1024, 112/1024, 176/1024, 128/1024, 160/1024, 128/1024
		];
		data[1] = fDWL.cube( [ -4.5, 0.5,    -9 ], 1, [ 1, 1,  6 ], [ 1, 1, 1, 1 ], false );
		data[1].t = [
			160/1024, 112/1024, 176/1024, 112/1024, 176/1024, 128/1024, 160/1024, 128/1024, 
			160/1024, 112/1024, 176/1024, 112/1024, 176/1024, 128/1024, 160/1024, 128/1024, 
			160/1024, 112/1024, 256/1024, 112/1024, 256/1024, 128/1024, 160/1024, 128/1024, 
			160/1024, 112/1024, 176/1024, 112/1024, 176/1024, 208/1024, 160/1024, 208/1024, 
			160/1024, 112/1024, 176/1024, 112/1024, 176/1024, 208/1024, 160/1024, 208/1024, 
			160/1024, 112/1024, 256/1024, 112/1024, 256/1024, 128/1024, 160/1024, 128/1024, 
		];
		data[2] = fDWL.cube( [   -3, 0.5,   2.5 ], 1, [ 4, 1,  1 ], [ 1, 1, 1, 1 ], false );
		data[2].t = data[0].t;
		data[3] = fDWL.cube( [ -4.5, 0.5,    -1 ], 1, [ 1, 1,  6 ], [ 1, 1, 1, 1 ], false );
		data[3].t = data[1].t;
		data[4] = fDWL.cube( [    3, 0.5, -12.5 ], 1, [ 4, 1,  1 ], [ 1, 1, 1, 1 ], false );
		data[4].t = data[0].t;
		data[5] = fDWL.cube( [    3, 0.5,   2.5 ], 1, [ 4, 1,  1 ], [ 1, 1, 1, 1 ], false );
		data[5].t = data[0].t;
		data[6] = fDWL.cube( [  4.5, 0.5,    -5 ], 1, [ 1, 1, 14 ], [ 1, 1, 1, 1 ], false );
		data[6].t = [
			160/1024, 112/1024, 176/1024, 112/1024, 176/1024, 128/1024, 160/1024, 128/1024, 
			160/1024, 112/1024, 176/1024, 112/1024, 176/1024, 128/1024, 160/1024, 128/1024, 
			176/1024, 112/1024, 176/1024, 336/1024, 160/1024, 336/1024, 160/1024, 112/1024, 
			160/1024, 112/1024, 176/1024, 112/1024, 176/1024, 338/1024, 160/1024, 338/1024, 
			160/1024, 112/1024, 176/1024, 112/1024, 176/1024, 338/1024, 160/1024, 338/1024, 
			176/1024, 112/1024, 176/1024, 336/1024, 160/1024, 336/1024, 160/1024, 112/1024, 
		];
		// 神殿床：左上
		flrVtx = [ 0, 0, 0,  3, 0, 0,  3, 0, 3,  2, 0, 3.4,  0.4, 0, 5,  0, 0, 6 ];
		flrOffs = [ -4, 0.5, -12 ];
		data[7] = {
			p: [],
			n: [ 0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0 ],
			c: [ 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1 ],
			t: [ 176/1024,128/1024, 224/1024,128/1024, 224/1024,176/1024, 208/1024,182/1024, 182/1024,208/1024, 176/1024,224/1024 ],
			i: [ 0, 5, 4, 3, 2, 1 ]
		};
		for( idx = 0; idx < flrVtx.length; idx += 3 ){
			data[7].p[idx  ] = flrVtx[idx  ] + flrOffs[0];
			data[7].p[idx+1] = flrVtx[idx+1] + flrOffs[1];
			data[7].p[idx+2] = flrVtx[idx+2] + flrOffs[2];
		}
		data[8] = {
			p: [],
			n: [ 1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0 ],
			c: [ 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1 ],
			t: [ 160/1024,112/1024, 176/1024,112/1024, 160/1024,160/1024, 176/1024,160/1024, 160/1024,177/1024, 176/1024,177/1024,
				 160/1024,210/1024, 176/1024,210/1024, 160/1024,218/1024, 176/1024,218/1024 ],
			i: [ 1, 0, 3, 2, 5, 4, 7, 6, 9, 8 ]
		};
		for( idx = 3; idx < flrVtx.length; idx += 3 ){
			data[8].p[idx*2-6] = flrVtx[idx  ] + flrOffs[0];
			data[8].p[idx*2-5] = flrVtx[idx+1] + flrOffs[1];
			data[8].p[idx*2-4] = flrVtx[idx+2] + flrOffs[2];
			data[8].p[idx*2-3] = flrVtx[idx  ] + flrOffs[0];
			data[8].p[idx*2-2] = flrVtx[idx+1];
			data[8].p[idx*2-1] = flrVtx[idx+2] + flrOffs[2];
		}
		// 神殿床：右上
		data[9] = {
			p: [],
			n: [],
			c: [],
			t: [],
			i: [ 0, 1, 2, 3, 4, 5 ]
		};
		data[9].n = data[7].n;
		data[9].c = data[7].c;
		data[9].t = data[7].t;
		for( idx = 0; idx < data[7].p.length; idx += 3 ){
			data[9].p[idx  ] = data[7].p[idx]*(-1);
			data[9].p[idx+1] = data[7].p[idx+1];
			data[9].p[idx+2] = data[7].p[idx+2];
		}
		data[10] = {
			p: [],
			n: [],
			c: [],
			t: [],
			i: [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
		};
		data[10].n = data[8].n;
		data[10].c = data[8].c;
		data[10].t = data[8].t;
		for( idx = 0; idx < data[8].p.length; idx += 3 ){
			data[10].p[idx  ] = data[8].p[idx]*(-1);
			data[10].p[idx+1] = data[8].p[idx+1];
			data[10].p[idx+2] = data[8].p[idx+2];
		}
		// 神殿床：右下
		data[11] = {
			p: [],
			n: [],
			c: [],
			t: [],
			i: [ 0, 1, 2, 3, 4, 5 ]
		};
		data[11].n = data[7].n;
		data[11].c = data[7].c;
		data[11].t = data[7].t;
		for( idx = 0; idx < data[7].p.length; idx += 3 ){
			data[11].p[idx  ] = data[7].p[idx];
			data[11].p[idx+1] = data[7].p[idx+1];
			data[11].p[idx+2] = data[7].p[idx+2]*(-1)-10;
		}
		data[12] = {
			p: [],
			n: [],
			c: [],
			t: [],
			i: [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
		};
		data[12].n = data[8].n;
		data[12].c = data[8].c;
		data[12].t = data[8].t;
		for( idx = 0; idx < data[8].p.length; idx += 3 ){
			data[12].p[idx  ] = data[8].p[idx];
			data[12].p[idx+1] = data[8].p[idx+1];
			data[12].p[idx+2] = data[8].p[idx+2]*(-1)-10;
		}
		// 神殿床：左下
		data[13] = {
			p: [],
			n: [],
			c: [],
			t: [],
			i: [ 0, 5, 4, 3, 2, 1 ]
		};
		data[13].n = data[7].n;
		data[13].c = data[7].c;
		data[13].t = data[7].t;
		for( idx = 0; idx < data[7].p.length; idx += 3 ){
			data[13].p[idx  ] = data[7].p[idx]*(-1);
			data[13].p[idx+1] = data[7].p[idx+1];
			data[13].p[idx+2] = data[7].p[idx+2]*(-1)-10;
		}
		data[14] = {
			p: [],
			n: [],
			c: [],
			t: [],
			i: [ 1, 0, 3, 2, 5, 4, 7, 6, 9, 8 ]
		};
		data[14].n = data[8].n;
		data[14].c = data[8].c;
		data[14].t = data[8].t;
		for( idx = 0; idx < data[8].p.length; idx += 3 ){
			data[14].p[idx  ] = data[8].p[idx]*(-1);
			data[14].p[idx+1] = data[8].p[idx+1];
			data[14].p[idx+2] = data[8].p[idx+2]*(-1)-10;
		}
		
		PalBase = new fDWL.Objs3D( gl, [ 0, 0, 0 ], [ 0, 0, 0 ], [ 1, 1, 1 ], data, dataType );
	}());
	
	// 神殿屋根
	(function(){
		var data = [],
			dataType = [ gl.TRIANGLES ],
			idx = 0,
			vertice = [
				[  5,5,  3, -5,5,  3, -5,5,-13,  5,5,-13 ],
				[ -5,6,-13,  5,6,-13,  5,5,-13, -5,5,-13 ],
				[ -5,5,  3,  5,5,  3,  5,6,  3, -5,6,  3 ],
				[ -5,5,  3, -5,6,  3, -5,6,-13, -5,5,-13 ],
				[  5,5,-13,  5,6,-13,  5,6,  3,  5,5,  3 ]
			],
			normal = [ [ 0,-1,0 ], [ 0,0,1 ], [ 0,0,-1], [ -1,0,0 ], [ 1,0,0 ] ],
			tex = [
				144/1024,656/1024, 304/1024,656/1024, 304/1024,912/1024, 144/1024,912/1024,
				144/1024,656/1024, 304/1024,656/1024, 304/1024,672/1024, 144/1024,672/1024,
				144/1024,656/1024, 304/1024,656/1024, 304/1024,672/1024, 144/1024,672/1024,
				144/1024,656/1024, 144/1024,672/1024, 304/1024,672/1024, 304/1024,656/1024,
				144/1024,656/1024, 144/1024,672/1024, 304/1024,672/1024, 304/1024,656/1024
			];
		
		data[0] = fDWL.rects( vertice, normal, [ 1, 1, 1, 1 ], tex, [ 0, 0, 0 ], [ 0, 0, 0 ] );
		PalRoof = new fDWL.Objs3D( gl, [ 0, 0, 0 ], [ 0, 0, 0 ], [ 1, 1, 1 ], data, dataType );
	}());
	
	// 神殿可変部
	(function(){
		var data = [],
			dataType = [ gl.TRIANGLES ],
			idx = 0,
			vertice = [
				[  1,  0,-2, -1,  0,-2, -1,0.5,-2,  1,0.5,-2 ],
				[  1,0.5,-2, -1,0.5,-2, -1,0.5, 2,  1,0.5, 2 ],
				[ -1,  0, 2,  1,  0, 2,  1,0.5, 2, -1,0.5, 2 ]
			],
			normal = [ [ 0,0,1 ], [ 0,1,0 ], [ 0,0,-1] ],
			tex = [
				160/1024,112/1024, 176/1024,112/1024, 176/1024,128/1024, 160/1024,128/1024,
				160/1024,112/1024, 176/1024,112/1024, 176/1024,128/1024, 160/1024,128/1024,
				160/1024,112/1024, 176/1024,112/1024, 176/1024,128/1024, 160/1024,128/1024
			];
		
		data[0] = fDWL.rects( vertice, normal, [ 1, 1, 1, 1 ], tex, [ 0, 0, 1 ], [ 0, 0, 0 ] );
		VarWall = new fDWL.Objs3D( gl, [ 0, 0, 0 ], [ 0, 0, 0 ], [ 1, 1, 1 ], data, dataType );
		VarWall.isDraw = function( hPos ){
			return ( hPos > 0.0 );
		}
		VarWall.update = function( hPos ){
			if( hPos < 1 ){
				this.scale[1] = hPos;
			}else{
				this.scale[1] = 1;
			}
		}
	}());
	
	// 台座
	(function(){
		var data = [],
			dataType = [ gl.TRIANGLE_STRIP, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN ],
			idx = 0,
			offsY = 0,
			flrOffs = [],
			flrVtx = [],
			tmpVec = [];
		
		data[0] = fDWL.cylinder( 8, 1, 2.1, [ 1, 1, 1, 1 ], [ 0, 0, 0 ], [ 0, 0, 0 ] );
		data[1] = fDWL.cylinder( 8, 0.2, 2.1, [ 1, 1, 1, 1 ], [ 0, 0.6, 0 ], [ 0, 0, 0 ] );
		for( idx = 0; idx < data[0].t.length; idx += 8 ){
			data[0].t[idx  ] = data[1].t[idx  ] = 160/1024;
			data[0].t[idx+1] = data[1].t[idx+1] = 128/1024;
			data[0].t[idx+2] = data[1].t[idx+2] = 160/1024;
			data[0].t[idx+3] = data[1].t[idx+3] = 112/1024;
			data[0].t[idx+4] = data[1].t[idx+4] = 176/1024;
			data[0].t[idx+5] = data[1].t[idx+5] = 128/1024;
			data[0].t[idx+6] = data[1].t[idx+6] = 176/1024;
			data[0].t[idx+7] = data[1].t[idx+7] = 112/1024;
		}
		
		for( idx = 0; idx < data[1].p.length; idx += 6 ){
			data[1].p[idx+3] = data[1].p[idx+3]*0.8;
			data[1].p[idx+5] = data[1].p[idx+5]*0.8;
			
			tmpVec = fDWL.normalize3( [ data[1].n[idx], data[1].n[idx+1]+1.0, data[1].n[idx+2]  ] );
			data[1].n[idx  ] = tmpVec[0];
			data[1].n[idx+1] = tmpVec[1];
			data[1].n[idx+2] = tmpVec[2];
			data[1].n[idx+3] = tmpVec[0];
			data[1].n[idx+4] = tmpVec[1];
			data[1].n[idx+5] = tmpVec[2];
		}
		
		data[2] = fDWL.corn( 8, 0, 1.7, [ 1, 1, 1, 1 ], 1, [ 0, 0.7, 0 ], [ 0, 0, 0 ] );
		data[2].t = [
			128/1024,690/1024, 128/1024,657/1024, 144/1024,657/1024, 128/1024,657/1024, 144/1024,657/1024,
			128/1024,657/1024, 144/1024,657/1024, 128/1024,657/1024, 144/1024,657/1024, 128/1024,657/1024
		];
		
		StatueBase = new fDWL.Objs3D( gl, [ 0, 0, -5 ], [ 0, 3.14159/8, 0 ], [ 1, 1, 1 ], data, dataType );
	}());
	
	// 円柱
	(function(){
		var texPos = [
				48/1024,784/1024, 48/1024,656/1024, 64/1024,784/1024, 64/1024,656/1024, 80/1024,784/1024,  80/1024,656/1024,
				96/1024,784/1024, 96/1024,656/1024, 80/1024,784/1024, 80/1024,656/1024, 64/1024,784/1024,  64/1024,656/1024, 
				48/1024,784/1024, 48/1024,656/1024
			],
			pillarPos = [
				[  1.5, 1,   2.5, 0 ], [  2.5, 1,   2.5, 1 ], [  3.5, 1,   2.5, 0 ], [  4.5, 0.4,   3.1, 1 ],
				[  4.5, 1,   1.5, 0 ], [  4.5, 1,   0.5, 1 ], [  4.5, 1,  -0.5, 0 ], [  4.5, 1,  -1.5, 1 ], [  4.5, 1,  -2.5, 0 ], [  4.5, 1,  -3.5, 1 ], [  4.5, 1,  -4.5, 0 ],
				[  4.5, 1,  -5.5, 0 ], [  4.5, 1,  -6.5, 1 ], [  4.5, 1,  -7.5, 0 ], [  4.5, 1,  -8.5, 1 ], [  4.5, 1,  -9.5, 0 ], [  4.5, 1, -10.5, 1 ], [  4.5, 1, -11.5, 0 ], [  4.5, 1, -12.5, 1 ],
				[  3.5, 1, -12.5, 0 ], [  4.5, 1, -12.5, 1 ], [  1.5, 1, -12.5, 0 ], [  2.5, 1, -12.5, 1 ],
				[ -1.5, 1, -12.5, 0 ], [ -2.5, 1, -12.5, 1 ], [ -3.5, 1, -12.5, 0 ], [ -4.5, 1, -12.5, 1 ],
				[ -4.5, 1, -11.5, 0 ], [ -4.5, 1, -10.5, 1 ], [ -4.5, 1,  -9.5, 0 ], [ -4.5, 1,  -8.5, 1 ], [ -4.5, 1,  -7.5, 0 ], [ -4.5, 1,  -6.5, 1 ],
				[ -4.5, 1,  -3.5, 1 ], [ -4.5, 1,  -2.5, 0 ], [ -4.5, 1,  -1.5, 1 ], [ -4.5, 1,  -0.5, 0 ], [ -4.5, 1,   0.5, 1 ], [ -4.5, 1,   1.5, 0 ],
				[ -4.5, 1,   2.5, 1 ], [ -3.5, 1,   2.5, 0 ], [ -2.5, 1,   2.5, 1 ], [ -1.5, 1,   2.5, 0 ],
				[ -0.5, 0,   2.5, 1 ], [  0.5, 0,   2.5, 1 ]
			],
			height = 4;
			idx = 0;
		
		for( idx = 0; idx < pillarPos.length; ++idx ){
			if( idx == pillarPos.length-2 ){
				height = 6;
			}
			Cylinder4D[idx] = new fDWL.D4D.Cylinder4D( gl, pillarPos[idx], [ 0, 0, 0 ], 6, height, 0.4, [ 1,1,1,1 ], [ 0,2,0 ], [ 0,0,0 ] );
			Cylinder4D[idx].setTexVbo( texPos );
			Cylinder4D[idx].hStrip = 2;
			Cylinder4D[idx].isDraw = isDrawOfPillar;
			Cylinder4D[idx].calcScale = calcScaleOfPillar;
		}
		// 倒れた円柱
		Cylinder4D[3].update = function( hPos ){
			if(( 0 < hPos )&&( hPos < 2 )){
				this.rotate[0] = 1.3;
				this.pos = [ 4.5, 0.4, 3.1, 1 ];
			}else{
				this.rotate[0] = 0;
				this.pos = [ 4.5, 1, 2.5, 1 ];
			}
			// hPosに基づくscale計算
			this.calcScale( hPos );
		}
	}());
	
	// 円錐
	(function(){
		// 倒れた円柱の上面部
		Corn4D = new fDWL.D4D.Corn4D( gl, [ 4.5, 1.45, 6.9, 1 ], [ 1.3, 0, 0 ], 6, 0, 0.39, [ 1,1,1,1 ], 1, [ 0,0,0 ], [ 0,0,0 ] );
		Corn4D.setTexVbo( [
			128/1024,690/1024, 128/1024,657/1024, 144/1024,657/1024, 128/1024,657/1024, 144/1024,657/1024,
			128/1024,657/1024, 144/1024,657/1024, 128/1024,657/1024, 144/1024,657/1024, 128/1024,657/1024
		] );
	}());
	
	// 隆起／沈降地面の道路パッチ
	(function(){
		var data = [],
			dataType = [ gl.TRIANGLES ],
			idx = 0,
			vertice = [
				[ -5,0,14, -7,0,14, -7,0,15, -5,0,15 ],
				[ -5,0,15, -7,0,15, -7,0,16, -5,0,16 ]
			],
			normal = [ [ 0,0.968,0.25 ], [ 0,1,0 ] ],
			tex = [
				96/1024,544/1024, 128/1024,544/1024, 128/1024,560/1024, 96/1024,560/1024,
				96/1024,560/1024, 128/1024,560/1024, 128/1024,576/1024, 96/1024,576/1024
			];
		
		data[0] = fDWL.rects( vertice, normal, [ 1, 1, 1, 1 ], tex, [ 0, 0, 0 ], [ 0, 0, 0 ] );
		RoadPatch = new fDWL.Objs3D( gl, [ 0, 0, 0 ], [ 0, 0, 0 ], [ 1, 1, 1 ], data, dataType );
	}());
	
	
	StdShaderParam = [ 0, 0, 0, light00.position, 1, 2, 0 ];
	ShadowShaderParam = [ 0, 0, 0, 0, 0, light00.position, 0, 1, 2, 0 ];
	
	// コリジョンデータ
	//	[ CollType(0:Normal, 1-:Specials), X, Z, W, H, mvX, mvZ(, spId, leng) ]
	//	spId:基準点 0:左上, 1:右上,  2:左下, 3:右下
	//	len:基準距離
	CollArea[0] = [	// Gr00
		[ 0, -11, -19,  -7, -18,    0, 0.1, 0, 0 ],
		[ 0, -13, -17, -12,  -9,  0.1,   0, 0, 0 ],
		[ 0,  -6, -17,  -5,  -9, -0.1,   0, 0, 0 ],
		[ 0, -10, -11,  -9,  -9, -0.1,   0, 0, 0 ],
		[ 0,  -9, -11,  -8,  -9,  0.1,   0, 0, 0 ],
		[ 1, -13, -19, -11, -17,  0.07,  0.07, 3, 1 ],
		[ 1,  -7, -19,  -5, -17, -0.07,  0.07, 2, 1 ],
		[ 1, -10, -12,  -9, -11, -0.07, -0.07, 0, 1 ],
		[ 1,  -9, -12,  -8, -11,  0.07, -0.07, 1, 1 ]
	],
	CollArea[1] = [	// Gr01
		[ 0,  1, -17,  6, -16,     0,   0.1, 0, 0 ],
		[ 0, -2, -14, -1,  -9,   0.1,     0, 0, 0 ],
		[ 1,  1, -14,  6,  -9, -0.07, -0.07, 0, 1 ],
		[ 1, -2, -17,  1, -14,  0.07,  0.07, 3, 2 ]
	],
	CollArea[2] = [	// Gr02
		[ 0,  4, -17,  8, -16,     0,   0.1, 0, 0 ],
		[ 0, 11, -13, 12,  -8,  -0.1,     0, 0, 0 ],
		[ 1,  4, -14,  9,  -8,  0.07, -0.07, 1, 2 ],
		[ 1,  8, -17, 12, -13, -0.07,  0.07, 2, 3 ]
	],
	CollArea[3] = [	// Gr03
		[ 0, -13, -11, -12,  1,   0.1,   0, 0, 0 ],
		[ 0, -10, -11,  -9,  1,  -0.1,   0, 0, 0 ],
		[ 0,  -9, -11,  -8, -4,   0.1,   0, 0, 0 ],
		[ 0,  -6, -11,  -5, -7,  -0.1,   0, 0, 0 ],
		[ 0,  -8,  -4,  -4, -3,     0,  -0.1, 0, 0 ],
		[ 0,  -9,  -4,  -8, -3,  0.07, -0.07, 0, 0 ],
		[ 0,  -5,  -7,  -4, -6,     0,   0.1, 0, 0 ],
		[ 3,  -6,  -7,  -5, -6, -0.07,  0.07, 0, 0 ]
	],
	CollArea[4] = [	// Gr04
		[ 0, -6,  -7, -4, -6,    0,   0.1, 0, 0 ],
		[ 0, -6,  -4, -4, -3,    0,  -0.1, 0, 0 ],
		[ 0, -2, -11, -1, -9,  0.1,     0, 0, 0 ],
		[ 0,  1, -11,  2, -9, -0.1,     0, 0, 0 ],
		[ 0, -2,  -1,  2,  0,    0,  -0.1, 0, 0 ],
		[ 0,  4,  -7,  5, -3, -0.1,     0, 0, 0 ],
		[ 9, -1, -10,  1, -8,    0,     0, 0, 0 ],		// ダミー
		[ 9, -5,  -6, -3, -4,    0,     0, 0, 0 ],		// ダミー
		[ 2, -2,  -7,  2, -3,  0.1,     0, 0, 2 ],		// 特殊：内側
		[ 2, -4,  -9,  4, -1, -0.1,     0, 1, 4 ]		// 特殊：外側
	],
	CollArea[5] = [	// Gr05
		[ 0,  8, -11,  9, 1,  0.1, 0, 0, 0 ],
		[ 0, 11, -11, 12, 1, -0.1, 0, 0, 0 ]
	],
	CollArea[6] = [	// Gr06
		[ 0, -13, -1, -12,  1,  0.1, 0, 0, 0 ],
		[ 0, -15,  3, -14, 7,  0.1, 0, 0, 0 ],
		[ 0, -13,  9, -12, 11,  0.1, 0, 0, 0 ],
		[ 0, -10, -1,  -9,  1, -0.1, 0, 0, 0 ],
		[ 0,  -8,  3,  -7,  7, -0.1, 0, 0, 0 ],
		[ 0, -10,  9,  -9, 11, -0.1, 0, 0, 0 ],
		[ 0, -12,  4, -11,  6, -0.1, 0, 0, 0 ],
		[ 0, -11,  4, -10,  6,  0.1, 0, 0, 0 ],
		[ 1, -15,  1, -12,  3,  0.07,  0.07, 3, 2 ],
		[ 1, -15,  7, -12,  9,  0.07, -0.07, 1, 2 ],
		[ 1, -10,  1,  -7,  3, -0.07,  0.07, 2, 2 ],
		[ 1, -10,  7,  -7,  9, -0.07, -0.07, 0, 2 ],
		[ 1, -12,  3, -11,  4, -0.07, -0.07, 0, 1 ],
		[ 1, -11,  3, -10,  4,  0.07, -0.07, 1, 1 ],
		[ 1, -12,  6, -11,  7, -0.07,  0.07, 2, 1 ],
		[ 1, -11,  6, -10,  7, -0.1,      0, 3, 1 ]
	],
	CollArea[7] = [	// Gr07
		[ 0, -1, 2,  6,  3,     0,   0.1, 0, 0 ],
		[ 0,  2, 5,  6,  6,     0,  -0.1, 0, 0 ],
		[ 0, -2, 3, -1,  7,   0.1,     0, 0, 0 ],
		[ 0, -3, 8, -2, 11,   0.1,     0, 0, 0 ],
		[ 0,  2, 8,  3, 11,  -0.1,     0, 0, 0 ],
		[ 0, -2, 2, -1,  3,  0.07,  0.07, 0, 0 ],
		[ 3,  1, 5,  2,  6, -0.07, -0.07, 0, 0 ],
		[ 0,  1, 6,  2,  7,  -0.1,     0, 0, 0 ],
		[ 1, -3, 7, -1,  8,  0.07,  0.07, 3, 1 ],
		[ 1,  1, 7,  3,  8, -0.07,  0.07, 2, 1 ]
	],
	CollArea[8] = [	// Gr08
		[ 0,  4,  2,  8, 3,     0,   0.1, 0, 0 ],
		[ 0,  4,  5,  9, 6,     0,  -0.1, 0, 0 ],
		[ 0,  8, -1,  9, 2,   0.1,     0, 0, 0 ],
		[ 0, 11, -1, 12, 3,  -0.1,     0, 0, 0 ],
		[ 1,  8,  2,  9, 3,  0.07,  0.07, 3, 1 ],
		[ 1,  9,  3, 12, 6, -0.07, -0.07, 0, 2 ]
	],
	CollArea[9] = [	// Gr09
		[ 0,  -9, 13,  -4, 14,     0,   0.1, 0, 0 ],
		[ 0, -10, 16,  -4, 17,     0,  -0.1, 0, 0 ],
		[ 0, -13,  9, -12, 14,   0.1,     0, 0, 0 ],
		[ 0, -10,  9,  -9, 13,  -0.1,     0, 0, 0 ],
		[ 1, -10, 13,  -9, 14, -0.07,  0.07, 2, 1 ],
		[ 1, -13, 14, -10, 17,  0.07, -0.07, 1, 2 ]
	],
	CollArea[10] = [	// Gr10
		[ 0, -6, 13, -3, 14,     0,   0.1, 0, 0 ],
		[ 0, -6, 16,  1, 17,     0,  -0.1, 0, 0 ],
		[ 0, -3,  9, -2, 13,   0.1,     0, 0, 0 ],
		[ 0,  2,  9,  3, 15,  -0.1,     0, 0, 0 ],
		[ 3, -3, 13, -2, 14 , 0.07,  0.07, 0, 0 ],
		[ 1,  1, 15,  3, 17, -0.07, -0.07, 0, 1 ]
	];
	
	// Y軸高さデータ
	//	[ L, U, R, D, type, Y-height, Y-vecX, Y-vecZ, H-height, H-vecX, H-vecZ ]
	//	左,上,右,下, 型( 0:平坦, 1:Y斜面, 2:H斜面, 3:YH斜面 ), 右上点Y高さ, X方向Y傾斜ベクトル, Z方向Y傾斜ベクトル, H高さ, X-Hvec, Z-Hvec
	YH_Heights[0] = 
		[	// Gr00
			[ -12, -18,  -6, -11, 0, 1, 0,    0, 4, 0,    0 ],
			[ -12, -11, -10, -10, 0, 1, 0,    0, 4, 0,    0 ],
			[  -8, -11,  -6, -10, 3, 1, 0, -0.2, 4, 0, -0.2 ]
		],
	YH_Heights[1] = 
		[	// Gr01
			[  -1, -16, 3, -12, 0, 0, 0, 0, 5,     0,   0 ],
			[   3, -16, 5, -14, 2, 0, 0, 0, 5, -0.25,   0 ],
			[  -1, -13, 1, -10, 2, 0, 0, 0, 5,     0, 0.25 ]
		],
	YH_Heights[2] = 
		[	// Gr02
			
			[ 7, -16, 11, -11, 0, 0, 0,    0,   4,     0,   0 ],
			[ 5, -16,  7, -14, 2, 0, 0,    0, 4.5, -0.25,   0 ],
			[ 9, -11, 11, -10, 3, 0, 0, -0.2,   4,     0, 0.2 ]
		],
	YH_Heights[3] = 
		[	// Gr03
			[ -12, -10, -10, -0, 3,   1, 0, -0.1,   4, 0, -0.1 ],
			[  -8, -10,  -6, -6, 3, 0.8, 0, -0.2, 4.8, 0, -0.2 ],
			[  -8,  -6,  -6, -4, 0,   0, 0,    0,   5, 0,    0 ],
			[  -6,  -6,  -5, -4, 2,   0, 0,    0,   5, 1,    0 ]
		],
	YH_Heights[4] = 
		[	// Gr04
			[ -4,  -9,  4, -1, 0, 0, 0, 0, 6, 0, 0 ],
			[ -5,  -6, -4, -4, 0, 0, 0, 0, 6, 0, 0 ],
			[ -1, -10,  1, -9, 2, 0, 0, 0, 5.75, 0, 0.25 ]
		],
	YH_Heights[5] = 
		[	// Gr05
			[ 9, -10, 11, -6, 3, -0.2, 0, -0.2, 3.8, 0, -0.2 ],
			[ 9,  -6, 11, -4, 0,   -1, 0,    0,   3, 0,    0 ],
			[ 9,  -4, 11,  0, 3,   -1, 0,  0.2,   3, 0, -0.2 ]
		],
	YH_Heights[6] = 
		[	// Gr06
			[ -12, 0, -10,  1, 0,   0, 0, 0, 3, 0,     0 ],
			[ -14, 1,  -8,  9, 0,   0, 0, 0, 3, 0,     0 ],
			[ -12, 9, -10, 10, 2,   0, 0, 0, 3, 0, -0.25 ]
		],
	YH_Heights[7] = 
		[	// Gr07
			[ -2, 7, 2, 10, 0, 0, 0, 0, 0,    0,   0 ],
			[ -1, 5, 1,  7, 2, 0, 0, 0, 1,    0,-0.5 ],
			[ -1, 3, 1,  5, 0, 0, 0, 0, 1,    0,   0 ],
			[  1, 3, 4,  5, 2, 0, 0, 0, 1, 0.33,   0 ],
			[  4, 3, 5,  5, 0, 0, 0, 0, 2,    0,   0 ]
		],
	YH_Heights[8] = 
		[	// Gr08
			[ 7, 1, 11, 5, 2,    0, 0,   0,   2, 0,    0 ],
			[ 5, 3,  7, 5, 0,    0, 0,   0,   2, 0,    0 ],
			[ 9, 0, 11, 1, 3, -0.2, 0, 0.2, 2.2, 0, -0.2 ]
		],
	YH_Heights[9] = 
		[	// Gr09
			[ -12, 13,  -9, 16, 0, 0, 0, 0,    2,    0,     0 ],
			[ -12, 10, -10, 13, 2, 0, 0, 0, 2.75,    0, -0.25 ],
			[  -9, 14,  -7, 16, 2, 0, 0, 0,    2, -0.5,     0 ],
			[  -7, 14,  -5, 16, 0, 0, 0, 0,    1,    0,     0 ]
		],
	YH_Heights[10] = 
		[	// Gr10
			[ -3, 10,  2, 16, 0, 0, 0, 0, 0,    0, 0 ],
			[ -5, 14, -3, 16, 2, 0, 0, 0, 1, -0.5, 0 ]
		];
	
	// ビューxプロジェクション座標変換行列
	mat4.lookAt( views.eyePosition, views.lookAt, [0, 1, 0], viewMatrix);
	mat4.perspective(45, cnvs.width / cnvs.height, 0.1, 100, projMatrix);
	mat4.multiply(projMatrix, viewMatrix, vepMatrix);
    
	// Depth Test
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	// cntrls
	cntrls.nbrOfFramesForFps = 0;
	cntrls.prevFrameTimeStamp = Date.now();
	cntrls.fpsCounter = document.getElementById("fps");

	cntrls.eLHight = document.getElementById('LightHight');
	cntrls.eHPos = document.getElementById('H_Pos');
	
	cntrls.RotXY = document.getElementById('RotXY');
	cntrls.RotYZ = document.getElementById('RotYZ');
	cntrls.RotYH = document.getElementById('RotYH');
	cntrls.RotZH = document.getElementById('RotZH');
	cntrls.RotXH = document.getElementById('RotXH');
	cntrls.RotXZ = document.getElementById('RotXZ');
	
	cntrls.oldHPos = (-100);
	cntrls.angXH = 0;
	
	cntrls.RotXY.addEventListener( "change", function(){ cntrls.oldHPos = (-100); }, false );
	cntrls.RotYZ.addEventListener( "change", function(){ cntrls.oldHPos = (-100); }, false );
	cntrls.RotYH.addEventListener( "change", function(){ cntrls.oldHPos = (-100); }, false );
	cntrls.RotZH.addEventListener( "change", function(){ cntrls.oldHPos = (-100); }, false );
	cntrls.RotXH.addEventListener( "change", function(){ cntrls.oldHPos = (-100); }, false );
	cntrls.RotXZ.addEventListener( "change", function(){ cntrls.oldHPos = (-100); }, false );
	
	draw();
	
	// 恒常ループ
	function draw(){
		var	texAndRate = [],
			hPos = 0,
			eyeRad = 0,
			currentTime = 0,
			fldPos = [],
			fldAng = [],
			collisionId = 0,
			heightPair = [];
		
		// 現在のフレーム数を表示
		cntrls.requestId = requestAnimationFrame( draw );
		currentTime = Date.now();
		if( currentTime - cntrls.prevFrameTimeStamp >= 1000 ){
			cntrls.fpsCounter.innerHTML = cntrls.nbrOfFramesForFps;
			cntrls.nbrOfFramesForFps = 0;
			cntrls.prevFrameTimeStamp = currentTime;
		}
		
		// キー入力から移動速度・進行方向・視点位置を修正
		(function(){
			var speed = VELOCITY;
			if( keyStatus[5] ){
				speed *= 2;
			}
			moveXZ.vel = 0.0;
			if( keyStatus[0] ){
				if( keyStatus[4] ){	// shift
					views.height += 0.1;
					if( views.height > 4 ){
						views.height = 4;
					}
				}else{
					moveXZ.vel = speed;
				}
			}
			if( keyStatus[1] ){
				if( keyStatus[4] ){	// shift
					views.height -= 0.1;
					if( views.height < 0 ){
						views.height = 0;
					}
				}else{
					moveXZ.vel = -speed;
				}
			}
			if( keyStatus[2] ){
				moveXZ.rot -= ROT_RATE;
				if( moveXZ.rot > Math.PI*2 ){
					moveXZ.rot -= Math.PI*2;
				}
			}
			if( keyStatus[3] ){
				moveXZ.rot += ROT_RATE;
				if( moveXZ.rot < 0 ){
					moveXZ.rot += Math.PI*2;
				}
			}
			// 移動偏差
			var sinRot = Math.sin( moveXZ.rot ),
				cosRot = Math.cos( moveXZ.rot );
			moveXZ.dif[0] = -sinRot*moveXZ.vel;
			moveXZ.dif[1] =  cosRot*moveXZ.vel;
			// 衝突判定による位置調整を行う
			collisionId = Math.floor((views.lookAt[0]+FIELD_OFFS*1.5)/FIELD_OFFS) + Math.floor((views.lookAt[2]+FIELD_OFFS*2)/FIELD_OFFS)*3;
			checkCollision( collisionId, views.lookAt, moveXZ );
			views.lookAt[0] += moveXZ.dif[0];
			views.lookAt[2] += moveXZ.dif[1];
			heightPair = getLandHight( collisionId, views.lookAt[0], views.lookAt[2] );
			if( heightPair === undefined ){
				heightPair = [ views.lookAt[1], 0 ];
			}else{
				heightPair[0] += views.height;
			}
			views.lookAt[1] = heightPair[0];
			// 視点位置
			views.eyePosition[0] = views.lookAt[0] + sinRot*SIGHT_LENGTH;
			views.eyePosition[1] = views.lookAt[1] +        SIGHT_HEIGHT - views.height;
			views.eyePosition[2] = views.lookAt[2] - cosRot*SIGHT_LENGTH;
			
			// 視点行列を算出
			mat4.lookAt( views.eyePosition, views.lookAt, [0, 1, 0], viewMatrix);
			mat4.multiply( projMatrix, viewMatrix, vepMatrix );
			
			// ロータリー内でのXH回転
			if( collisionId == 4 ){
				// 位置が右下半分内
				if( views.lookAt[0] + views.lookAt[2] + 5 > 0 ){
					var moveDir = moveXZ.dif[1] - moveXZ.dif[0];
					if( moveDir > 0 ){
						cntrls.angXH += 0.01;
						if( cntrls.angXH > Math.PI*2 ){
							cntrls.angXH -= Math.PI*2;
						}
					}else
					if( moveDir < 0 ){
						cntrls.angXH -= 0.01;
						if( cntrls.angXH < 0 ){
							cntrls.angXH += Math.PI*2;
						}
					}
				}
			}
		}());
		
		// デプス用
		(function(){
			// テクスチャ変換用行列
			mat4.identity(texMatrix);
			texMatrix[0]	= 0.5; texMatrix[1]	 =  0.0; texMatrix[2]	= 0.0; texMatrix[3]	 = 0.0;
			texMatrix[4]	= 0.0; texMatrix[5]	 = -0.5; texMatrix[6]	= 0.0; texMatrix[7]	 = 0.0;
			texMatrix[8]	= 0.0; texMatrix[9]	 =  0.0; texMatrix[10]	= 1.0; texMatrix[11] = 0.0;
			texMatrix[12]	= 0.5; texMatrix[13] =  0.5; texMatrix[14]	= 0.0; texMatrix[15] = 1.0;
			
			// ライトからみた行列群
			mat4.lookAt( light00.position, [0, 0, 0], light00.upDirection, dvMatrix );	// View
			mat4.perspective( 90, 1.0, 0.1, 150, dpMatrix );			// Projection
			// テクスチャ
			mat4.multiply( texMatrix, dpMatrix, dvpMatrix );
			mat4.multiply( dvpMatrix, dvMatrix, texMatrix );
			// ライトから見たvp
			mat4.multiply( dpMatrix, dvMatrix, dvpMatrix );
			
		}());
		
		// H軸位置設定
		hPos = cntrls.eHPos.value*(0.01);
//		hPos = heightPair[1];
		
		// 真４Ｄオブジェクトの更新：非移動時のみ
		if(( moveXZ.vel != 0 )||( cntrls.oldHPos != hPos )){
			PhoenixRotate[4] = cntrls.angXH;
			
			// 八胞体切断体の作成
			TriBuffer.initialize( triangleShader );
			
			// 彫像：頭部
			PhoenixHead.setRotate( [ cntrls.RotXY.value*(0.02), cntrls.RotYZ.value*(0.02), cntrls.RotYH.value*(0.02), cntrls.RotZH.value*(0.02), cntrls.RotXH.value*(0.02), cntrls.RotXZ.value*(0.02) ] );
//			PhoenixHead.setRotate( PhoenixRotate );
			PhoenixHead.transform();
			PhoenixHead.dividePylams( hPos );
			
			// 彫像：胴部
			PhoenixBody.setRotate( [ cntrls.RotXY.value*(0.02), cntrls.RotYZ.value*(0.02), cntrls.RotYH.value*(0.02), cntrls.RotZH.value*(0.02), cntrls.RotXH.value*(0.02), cntrls.RotXZ.value*(0.02) ] );
//			PhoenixBody.setRotate( PhoenixRotate );
			PhoenixBody.transform();
			PhoenixBody.dividePylams( hPos );
			
			// 彫像：脚部
			PhoenixFoot[0].setRotate( [ cntrls.RotXY.value*(0.02), cntrls.RotYZ.value*(0.02), cntrls.RotYH.value*(0.02), cntrls.RotZH.value*(0.02), cntrls.RotXH.value*(0.02), cntrls.RotXZ.value*(0.02) ] );
//			PhoenixFoot[0].setRotate( PhoenixRotate );
			PhoenixFoot[0].transform();
			PhoenixFoot[0].dividePylams( hPos );
			PhoenixFoot[1].setRotate( [ cntrls.RotXY.value*(0.02), cntrls.RotYZ.value*(0.02), cntrls.RotYH.value*(0.02), cntrls.RotZH.value*(0.02), cntrls.RotXH.value*(0.02), cntrls.RotXZ.value*(0.02) ] );
//			PhoenixFoot[1].setRotate( PhoenixRotate );
			PhoenixFoot[1].transform();
			PhoenixFoot[1].dividePylams( hPos );
			PhoenixFoot[2].setRotate( [ cntrls.RotXY.value*(0.02), cntrls.RotYZ.value*(0.02), cntrls.RotYH.value*(0.02), cntrls.RotZH.value*(0.02), cntrls.RotXH.value*(0.02), cntrls.RotXZ.value*(0.02) ] );
//			PhoenixFoot[2].setRotate( PhoenixRotate );
			PhoenixFoot[2].transform();
			PhoenixFoot[2].dividePylams( hPos );
			PhoenixFoot[3].setRotate( [ cntrls.RotXY.value*(0.02), cntrls.RotYZ.value*(0.02), cntrls.RotYH.value*(0.02), cntrls.RotZH.value*(0.02), cntrls.RotXH.value*(0.02), cntrls.RotXZ.value*(0.02) ] );
//			PhoenixFoot[3].setRotate( PhoenixRotate );
			PhoenixFoot[3].transform();
			PhoenixFoot[3].dividePylams( hPos );
		}
		// 現hPos値の記録
		cntrls.oldHPos = hPos;
		
		// ********** デプスバッファへの書込み **********
		// 準備
		gl.bindFramebuffer( gl.FRAMEBUFFER, fShadowBuffer.f );
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport( 0.0, 0.0, fBufferWidth, fBufferHeight );
		
		// オブジェクト描画
		gl.disable(gl.CULL_FACE);
		TriBuffer.useProgramDepth( depthShader );
		mat4.identity( modelMatrix );
		mat4.multiply( dvpMatrix, modelMatrix, lgtMatrix );
		depthShader.setUniLoc( lgtMatrix );
		//TriBuffer.draw();
		
		// Rollerのシャドウ
		Roller.drawShadow( depthShader, dvpMatrix );
		
		// 神殿のシャドウ
		(function(){
			var idx = 0,
				tmpMat = mat4.identity(mat4.create());
			
			if( Cylinder4D[3].isDraw( hPos ) ){
				Cylinder4D[3].update( hPos );
				
				Cylinder4D[3].rotate[0] *= -1;
				Cylinder4D[3].drawShadow( depthShader, hPos, dvpMatrix );
				Cylinder4D[3].rotate[0] *= -1;
			}
			// 神殿屋根
			tmpMat[10] *= -1;
			mat4.multiply( dvpMatrix, tmpMat, tmpMat );
			PalRoof.drawShadow( depthShader, tmpMat );
		}());
		
		// フレームバッファのバインドを解除
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		
		// フレームバッファをテクスチャとしてバインド
		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_2D, fShadowBuffer.t );
		
		// ********** カンバスへの書込み **********
		
		// canvasを初期化
		gl.clearColor(0.8, 0.8, 1.0, 1.0);
		gl.clearDepth( 1.0 );
		gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
		
		// ビューポート調整
		gl.viewport( 0.0, 0.0, cnvs.width, cnvs.height );
		
		gl.enable(gl.CULL_FACE);
		
		// Field4D
		(function(){
			for( var idx = 0; idx < Field4D.length; idx++ ){
				Field4D[idx].update( hPos );
				if( idx === 0 ){
					texAndRate = Field4D[idx].getTexRate( hPos );
					gl.activeTexture( gl.TEXTURE1 );
					gl.bindTexture( gl.TEXTURE_2D, texAndRate[0] );		// LowSideテクスチャ
					gl.activeTexture( gl.TEXTURE2 );
					gl.bindTexture( gl.TEXTURE_2D, texAndRate[1] );		// HighSideテクスチャ
				}
				Field4D[idx].draw( shadowShader, hPos, views.lookAt, vepMatrix, [ 0, 0, 0, texMatrix, lgtMatrix, light00.position, 0, 1, 2, 0 ] );
			}
		}());
		
		// 注視点位置表示
		//StdShaderParam = [ 0, 0, 0, light00.position, 1, 2, 0 ];
		(function(){
			var rotate = [];
			Roller.setPos( [ views.lookAt[0], views.lookAt[1]+Roller.height-views.height, views.lookAt[2] ] );
			rotate = Roller.getRotate();
			// Rollerの回転
			rotate[0] += moveXZ.vel;
			if( rotate[0] >= Math.PI*2 ){
				rotate[0] -= Math.PI*2;
			}
			// Roller方向変更の遅延反映
			rotate[1] = ( rotate[1]*7 + Math.PI*2 - moveXZ.rot )/8;
			Roller.setRotate( rotate );
			Roller.prepDraw( fieldShader, vepMatrix, StdShaderParam );
			Roller.draw( fieldShader );
		}());
		
//		gl.disable(gl.CULL_FACE);
		ShadowShaderParam[3] = texMatrix;
		ShadowShaderParam[4] = lgtMatrix;
		
		// 神殿基礎
		(function(){
			if( !PalBase.isDraw( hPos ) ){
				return;
			}
			PalBase.prepDraw( shadowShader, vepMatrix, ShadowShaderParam );
			PalBase.draw( shadowShader );
		}());
		
		// 神殿屋根
		(function(){
			if( !PalRoof.isDraw( hPos ) ){
				return;
			}
			PalRoof.prepDraw( fieldShader, vepMatrix, StdShaderParam );
			PalRoof.draw( fieldShader );
		}());
		
		// 彫像土台
		(function(){
			if( !StatueBase.isDraw( hPos ) ){
				return;
			}
			StatueBase.prepDraw( fieldShader, vepMatrix, StdShaderParam );
			StatueBase.draw( fieldShader );
		}());

		// 可変壁
		(function(){
			if( !VarWall.isDraw( hPos ) ){
				return;
			}
			VarWall.update( hPos );
			VarWall.prepDraw( shadowShader, vepMatrix, ShadowShaderParam );
			VarWall.draw( shadowShader );
		}());
		
		// 円柱
		(function(){
			var idx = 0;
			for( idx = 0; idx < Cylinder4D.length; ++idx ){
				if( !Cylinder4D[idx].isDraw( hPos ) ){
					continue;
				}
				Cylinder4D[idx].update( hPos );
				Cylinder4D[idx].draw( fieldShader, hPos, vepMatrix, StdShaderParam );
			}
		}());
		
		// 円柱端
		(function(){
			if( !Corn4D.isDraw( hPos ) ){
				return;
			}
			Corn4D.update( hPos );
			Corn4D.draw( fieldShader, hPos, vepMatrix, StdShaderParam );
		}());
		
		// 隆起／沈降地面の道路パッチ
		(function(){
			RoadPatch.prepDraw( fieldShader, vepMatrix, StdShaderParam );
			RoadPatch.draw( fieldShader );
		}());
		
		// 三角バッファの描画
		gl.disable(gl.CULL_FACE);
		TriBuffer.useProgram( triangleShader );
		mat4.identity( modelMatrix );
		mat4.inverse( modelMatrix, invMatrix);
		mat4.multiply( vepMatrix, modelMatrix, mvpMatrix );
		triangleShader.setUniLoc(
			mvpMatrix, invMatrix, light00.position, views.eyePosition, light00.ambient
		);
		TriBuffer.draw();
		
		// 環境用キューブ
		if( texInfo.tex !== 0 ){
			EnvCube.useProgram( texcubeShader );
			mat4.identity(modelMatrix);
			mat4.scale( modelMatrix, [ 72.0, 72.0, 72.0 ], modelMatrix);
			modelMatrix[13] = 25;					// 環境キューブを上方にシフト
			mat4.multiply(vepMatrix, modelMatrix, mvpMatrix);
			texcubeShader.setUniLoc( modelMatrix, mvpMatrix, texInfo );
			EnvCube.draw();
		}
		
		// コンテキストの再描画
		gl.flush();
    
		// ループのための再帰呼び出し
		//setTimeout(arguments.callee, 1000/30);
		
		cntrls.nbrOfFramesForFps++;
	}
	
	// 衝突判定による位置調整を行う
	function checkCollision( areaNo, viewPos, moveXZ ){
		var idx,
			pos = [],
			oneArea = [],
			stdX = 0,
			stdZ = 0,
			dist = 0,
			diff = 0,
			sinT = 0,
			cosT = 0;
		
		// コリジョン矩形から位置修正情報を得て、moveXZ.difを調整する
		//	[ CollType(0:Normal, 1-:Specials), X, Z, W, H, mvX, mvZ(, spId, leng) ]
		pos[0] = viewPos[0]+moveXZ.dif[0];	// 
		pos[2] = viewPos[2]+moveXZ.dif[1];	// 移動先で判定
		oneArea = CollArea[areaNo];
		for( idx = 0; idx < oneArea.length; ++idx ){
			// 矩形チェック
			if( ( pos[0] < oneArea[idx][1] )||( oneArea[idx][3] <= pos[0] )||
				( pos[2] < oneArea[idx][2] )||( oneArea[idx][4] <= pos[2] ) ){
				continue;
			}
			if( oneArea[idx][0] === 0 ){
				/* 微振動がうっとおしいので、変更
				// 反動ベクトルを設定
				moveXZ.dif[0] = oneArea[idx][5];
				moveXZ.dif[1] = oneArea[idx][6];
				*/
				// X方向でぶつかれば、当たり矩形のX座標との差を入れる
				if( oneArea[idx][5] > 0 ){
					moveXZ.dif[0] = oneArea[idx][3] - pos[0];
				}else
				if( oneArea[idx][5] < 0 ){
					moveXZ.dif[0] = oneArea[idx][1] - pos[0];
				}
				// Z方向でぶつかれば、当たり矩形のZ座標との差を入れる
				if( oneArea[idx][6] > 0 ){
					moveXZ.dif[1] = oneArea[idx][4] - pos[2];
				}else
				if( oneArea[idx][6] < 0 ){
					moveXZ.dif[1] = oneArea[idx][2] - pos[2];
				}
				break;
			}else
			if( oneArea[idx][0] === 1 ){
				// 欠損箇所かチェック
				dist = oneArea[idx][8];
				switch( oneArea[idx][7] ){
				case 0:
					stdX = oneArea[idx][1];
					stdZ = oneArea[idx][2];
					diff = (pos[0]-stdX)+(pos[2]-stdZ);
					break;
				case 1:
					stdX = oneArea[idx][3];
					stdZ = oneArea[idx][2];
					diff = -(pos[0]-stdX)+(pos[2]-stdZ);
					break;
				case 2:
					stdX = oneArea[idx][1];
					stdZ = oneArea[idx][4];
					diff = (pos[0]-stdX)-(pos[2]-stdZ);
					break;
				case 3:
					stdX = oneArea[idx][3];
					stdZ = oneArea[idx][4];
					diff = -(pos[0]-stdX)-(pos[2]-stdZ);
					break;
				default:
					break;
				}
				if( diff >= dist ){
					// 反動ベクトルを設定
					moveXZ.dif[0] = oneArea[idx][5];
					moveXZ.dif[1] = oneArea[idx][6];
				}
				break;
			}else
			if( oneArea[idx][0] === 2 ){
				// 円形内外
				stdX = pos[0] - (oneArea[idx][1]+oneArea[idx][3])/2;
				stdZ = pos[2] - (oneArea[idx][2]+oneArea[idx][4])/2;
				diff = stdX*stdX + stdZ*stdZ;
				dist = oneArea[idx][8];
				if(( diff <= (dist*dist) )^( oneArea[idx][7] === 1 )){
					// 反動ベクトルを設定
					diff = Math.sqrt( diff );
					sinT = stdX/diff;
					cosT = stdZ/diff;
					moveXZ.dif[0] = oneArea[idx][5]*sinT - oneArea[idx][6]*cosT;
					moveXZ.dif[1] = oneArea[idx][5]*cosT + oneArea[idx][6]*sinT;
				}
				break;
			}else
			if( oneArea[idx][0] === 3 ){
				// 直角コーナー
				// 移動前の点での矩形チェック
				if( viewPos[0] < oneArea[idx][1] ){
					moveXZ.dif[0] = oneArea[idx][1] - viewPos[0];
				}else
				if( oneArea[idx][3] <= viewPos[0] ){
					moveXZ.dif[0] = oneArea[idx][3] - viewPos[0];
				}
				if( viewPos[2] < oneArea[idx][2] ){
					moveXZ.dif[1] = oneArea[idx][2] - viewPos[2];
				}else
				if( oneArea[idx][4] <= viewPos[2] ){
					moveXZ.dif[1] = oneArea[idx][4] - viewPos[2];
				}
				if(( moveXZ.dif[0] != 0 )&&( moveXZ.dif[1] != 0 )){
					// 角の場合は反動ベクトルを設定
					moveXZ.dif[0] = oneArea[idx][5];
					moveXZ.dif[1] = oneArea[idx][6];
				}
			}else
			if( oneArea[idx][0] === 9 ){
				// ダミーあたり判定
				// ここに来れば、以下のあたり判定をキャンセル
				break;
			}else{
				// その他：今は無し
				
			}
		}
	};
	// コリジョン矩形と位置から現在の高度を得る
	// return: [ Y-高さ, H-高さ ]
	function getLandHight( areaNo, posX, posZ ){
		var idx,
			oneArea = [],
			heightY = 0,
			heightH = 0;
		
		// 高さ矩形から位置修正情報を得て調整する
		//	[ L, U, R, D, type, Y-height, Y-vecX, Y-vecZ, H-height, H-vecX, H-vecZ ]
		//	左,上,右,下, 型( 0:平坦, 1:Y斜面, 2:H斜面, 3:YH斜面 ), 右上点Y高さ, X方向Y傾斜ベクトル, Z方向Y傾斜ベクトル, H高さ, X-Hvec, Z-Hvec
		oneArea = YH_Heights[areaNo];
		for( idx = 0; idx < oneArea.length; ++idx ){
			// 矩形チェック
			if( ( posX < oneArea[idx][0] )||( oneArea[idx][2] < posX )||
				( posZ < oneArea[idx][1] )||( oneArea[idx][3] < posZ ) ){
				continue;
			}
			heightY = oneArea[idx][5];
			heightH = oneArea[idx][8];
			if( oneArea[idx][4] === 1 ){
				heightY += (posX - oneArea[idx][0])*oneArea[idx][6] + (posZ - oneArea[idx][1])*oneArea[idx][7];
			}else
			if( oneArea[idx][4] === 2 ){
				heightH += (posX - oneArea[idx][0])*oneArea[idx][9] + (posZ - oneArea[idx][1])*oneArea[idx][10];
			}else
			if( oneArea[idx][4] === 3 ){
				heightY += (posX - oneArea[idx][0])*oneArea[idx][6] + (posZ - oneArea[idx][1])*oneArea[idx][7];
				heightH += (posX - oneArea[idx][0])*oneArea[idx][9] + (posZ - oneArea[idx][1])*oneArea[idx][10];
			}
			break;
		}
		if( idx === oneArea.length ){
			// heightY = 0, heightH = 0;
			return undefined;
		}
		
		return [ heightY, heightH ];
	};
	
	
	// プログラムオブジェクトとシェーダを生成しリンクする関数
	function createShaderProgram( gl, vsId, fsId ){
		var shader = [],
			cnt = 0,
			scriptElement = [ document.getElementById(vsId), document.getElementById(fsId) ],
			program;
		
		if(( !scriptElement[0] )||( !scriptElement[1] )){
			return;
		}
		if(( scriptElement[0].type === 'x-shader/x-vertex' )&&( scriptElement[1].type === 'x-shader/x-fragment' )){
			shader[0] = gl.createShader(gl.VERTEX_SHADER);
			shader[1] = gl.createShader(gl.FRAGMENT_SHADER);
		}else{
			return;
		}
		for( cnt = 0; cnt < 2; ++cnt ){
			gl.shaderSource(shader[cnt], scriptElement[cnt].text);
			gl.compileShader(shader[cnt]);
			if( !gl.getShaderParameter(shader[cnt], gl.COMPILE_STATUS) ){
				alert(gl.getShaderInfoLog(shader[cnt]));
				return;
			}
		}
		
		program = gl.createProgram();
		gl.attachShader(program, shader[0]);
		gl.attachShader(program, shader[1]);
		gl.linkProgram(program);
		if( gl.getProgramParameter( program, gl.LINK_STATUS ) ){
			gl.useProgram(program);
			return program;
		}else{
			alert(gl.getProgramInfoLog(program));
			return;
		}
	}
	
	// VertexBufferObject 生成
	function create_vbo( data ){
		var vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		return vbo;
	}
	
	// IndexBufferObject 生成
	function create_ibo( data ){
		var ibo = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		return ibo;
	}
	
	// VBOをバインドし登録
	function set_attribute( vbo, attL, attS ){
		// 引数として受け取った配列を処理する
		for( var idx in vbo ){
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo[idx]);
			gl.enableVertexAttribArray(attL[idx]);
			gl.vertexAttribPointer(attL[idx], attS[idx], gl.FLOAT, false, 0, 0);
		}
	}
	
	// フレームバッファをオブジェクトとして生成
	function create_framebuffer( gl, width, height ){
		var frameBuffer = gl.createFramebuffer(),
			depthRenderBuffer = gl.createRenderbuffer(),
			fTexture = gl.createTexture();
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
		gl.bindTexture(gl.TEXTURE_2D, fTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		return {f : frameBuffer, d : depthRenderBuffer, t : fTexture};
	}
	// キューブマップテクスチャの作成
	function createCubeTexture( gl, texInfo ){
		var cImg = new Array();
		for( var cnt = 0; cnt < texInfo.name.length; cnt++ ){
			cImg[cnt] = new cubeMapImage();
			cImg[cnt].data.src = texInfo.name[cnt];
		}
		
		function cubeMapImage(){
			this.data = new Image();
			this.data.onload = function(){
				this.imageDataLoaded = true;
				checkLoaded();
			};
		}
		function checkLoaded(){
			if(	cImg[0].data.imageDataLoaded &&
				cImg[1].data.imageDataLoaded &&
				cImg[2].data.imageDataLoaded &&
				cImg[3].data.imageDataLoaded &&
				cImg[4].data.imageDataLoaded &&
				cImg[5].data.imageDataLoaded ){ generateCubeMap(); }
		}
		function generateCubeMap(){
			var tex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex );
			for( var ii = 0; ii < texInfo.name.length; ii++ ){
				gl.texImage2D( texInfo.mapPos[ii], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cImg[ii].data );
			}
			gl.generateMipmap( gl.TEXTURE_CUBE_MAP );
			
			gl.texParameteri( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
			gl.texParameteri( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
			gl.texParameteri( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
			gl.texParameteri( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
			texInfo.tex = tex;
			gl.bindTexture( gl.TEXTURE_CUBE_MAP, null );
		}
	}
	
	// 柱の関数
	function isDrawOfPillar( hPos ){
		var hTmp = hPos;
		do{
			if(( this.hPosLow <= hTmp )&&( hTmp < this.hPosHigh )){
				return true;
			}
			hTmp -= this.hStrip;
		}while( this.hPosLow <= hTmp );
		return false;
	}
	
	function calcScaleOfPillar( hPos ){
		var hTmp = hPos,
			hLen = 0;
		do{
			if(( this.hPosLow <= hTmp )&&( hTmp < this.hPosHigh )){
				hLen = Math.abs( this.pos[3] - hTmp );
				this.scale[3] = Math.sqrt( this.rad*this.rad - hLen*hLen )/this.rad;
				return;
			}
			hTmp -= this.hStrip;
		}while( this.hPosLow <= hTmp );
		this.scale[3] = 0;
	}
};


