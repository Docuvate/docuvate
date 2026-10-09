// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_ir_vector_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const LayoutIrVectorDtoKindEnum _$layoutIrVectorDtoKindEnum_rect =
    const LayoutIrVectorDtoKindEnum._('rect');
const LayoutIrVectorDtoKindEnum _$layoutIrVectorDtoKindEnum_line =
    const LayoutIrVectorDtoKindEnum._('line');
const LayoutIrVectorDtoKindEnum _$layoutIrVectorDtoKindEnum_path =
    const LayoutIrVectorDtoKindEnum._('path');

LayoutIrVectorDtoKindEnum _$layoutIrVectorDtoKindEnumValueOf(String name) {
  switch (name) {
    case 'rect':
      return _$layoutIrVectorDtoKindEnum_rect;
    case 'line':
      return _$layoutIrVectorDtoKindEnum_line;
    case 'path':
      return _$layoutIrVectorDtoKindEnum_path;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<LayoutIrVectorDtoKindEnum> _$layoutIrVectorDtoKindEnumValues =
    new BuiltSet<LayoutIrVectorDtoKindEnum>(const <LayoutIrVectorDtoKindEnum>[
  _$layoutIrVectorDtoKindEnum_rect,
  _$layoutIrVectorDtoKindEnum_line,
  _$layoutIrVectorDtoKindEnum_path,
]);

Serializer<LayoutIrVectorDtoKindEnum> _$layoutIrVectorDtoKindEnumSerializer =
    new _$LayoutIrVectorDtoKindEnumSerializer();

class _$LayoutIrVectorDtoKindEnumSerializer
    implements PrimitiveSerializer<LayoutIrVectorDtoKindEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'rect': 'rect',
    'line': 'line',
    'path': 'path',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'rect': 'rect',
    'line': 'line',
    'path': 'path',
  };

  @override
  final Iterable<Type> types = const <Type>[LayoutIrVectorDtoKindEnum];
  @override
  final String wireName = 'LayoutIrVectorDtoKindEnum';

  @override
  Object serialize(Serializers serializers, LayoutIrVectorDtoKindEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  LayoutIrVectorDtoKindEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      LayoutIrVectorDtoKindEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$LayoutIrVectorDto extends LayoutIrVectorDto {
  @override
  final LayoutIrVectorDtoKindEnum kind;
  @override
  final num x;
  @override
  final num y;
  @override
  final num width;
  @override
  final num height;
  @override
  final num? strokeWidthPt;
  @override
  final bool? filled;
  @override
  final num? fillGray;
  @override
  final BuiltList<num>? fillRgb;
  @override
  final BuiltList<num>? strokeRgb;
  @override
  final String? pathD;

  factory _$LayoutIrVectorDto(
          [void Function(LayoutIrVectorDtoBuilder)? updates]) =>
      (new LayoutIrVectorDtoBuilder()..update(updates))._build();

  _$LayoutIrVectorDto._(
      {required this.kind,
      required this.x,
      required this.y,
      required this.width,
      required this.height,
      this.strokeWidthPt,
      this.filled,
      this.fillGray,
      this.fillRgb,
      this.strokeRgb,
      this.pathD})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(kind, r'LayoutIrVectorDto', 'kind');
    BuiltValueNullFieldError.checkNotNull(x, r'LayoutIrVectorDto', 'x');
    BuiltValueNullFieldError.checkNotNull(y, r'LayoutIrVectorDto', 'y');
    BuiltValueNullFieldError.checkNotNull(width, r'LayoutIrVectorDto', 'width');
    BuiltValueNullFieldError.checkNotNull(
        height, r'LayoutIrVectorDto', 'height');
  }

  @override
  LayoutIrVectorDto rebuild(void Function(LayoutIrVectorDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutIrVectorDtoBuilder toBuilder() =>
      new LayoutIrVectorDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutIrVectorDto &&
        kind == other.kind &&
        x == other.x &&
        y == other.y &&
        width == other.width &&
        height == other.height &&
        strokeWidthPt == other.strokeWidthPt &&
        filled == other.filled &&
        fillGray == other.fillGray &&
        fillRgb == other.fillRgb &&
        strokeRgb == other.strokeRgb &&
        pathD == other.pathD;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, kind.hashCode);
    _$hash = $jc(_$hash, x.hashCode);
    _$hash = $jc(_$hash, y.hashCode);
    _$hash = $jc(_$hash, width.hashCode);
    _$hash = $jc(_$hash, height.hashCode);
    _$hash = $jc(_$hash, strokeWidthPt.hashCode);
    _$hash = $jc(_$hash, filled.hashCode);
    _$hash = $jc(_$hash, fillGray.hashCode);
    _$hash = $jc(_$hash, fillRgb.hashCode);
    _$hash = $jc(_$hash, strokeRgb.hashCode);
    _$hash = $jc(_$hash, pathD.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutIrVectorDto')
          ..add('kind', kind)
          ..add('x', x)
          ..add('y', y)
          ..add('width', width)
          ..add('height', height)
          ..add('strokeWidthPt', strokeWidthPt)
          ..add('filled', filled)
          ..add('fillGray', fillGray)
          ..add('fillRgb', fillRgb)
          ..add('strokeRgb', strokeRgb)
          ..add('pathD', pathD))
        .toString();
  }
}

class LayoutIrVectorDtoBuilder
    implements Builder<LayoutIrVectorDto, LayoutIrVectorDtoBuilder> {
  _$LayoutIrVectorDto? _$v;

  LayoutIrVectorDtoKindEnum? _kind;
  LayoutIrVectorDtoKindEnum? get kind => _$this._kind;
  set kind(LayoutIrVectorDtoKindEnum? kind) => _$this._kind = kind;

  num? _x;
  num? get x => _$this._x;
  set x(num? x) => _$this._x = x;

  num? _y;
  num? get y => _$this._y;
  set y(num? y) => _$this._y = y;

  num? _width;
  num? get width => _$this._width;
  set width(num? width) => _$this._width = width;

  num? _height;
  num? get height => _$this._height;
  set height(num? height) => _$this._height = height;

  num? _strokeWidthPt;
  num? get strokeWidthPt => _$this._strokeWidthPt;
  set strokeWidthPt(num? strokeWidthPt) =>
      _$this._strokeWidthPt = strokeWidthPt;

  bool? _filled;
  bool? get filled => _$this._filled;
  set filled(bool? filled) => _$this._filled = filled;

  num? _fillGray;
  num? get fillGray => _$this._fillGray;
  set fillGray(num? fillGray) => _$this._fillGray = fillGray;

  ListBuilder<num>? _fillRgb;
  ListBuilder<num> get fillRgb => _$this._fillRgb ??= new ListBuilder<num>();
  set fillRgb(ListBuilder<num>? fillRgb) => _$this._fillRgb = fillRgb;

  ListBuilder<num>? _strokeRgb;
  ListBuilder<num> get strokeRgb =>
      _$this._strokeRgb ??= new ListBuilder<num>();
  set strokeRgb(ListBuilder<num>? strokeRgb) => _$this._strokeRgb = strokeRgb;

  String? _pathD;
  String? get pathD => _$this._pathD;
  set pathD(String? pathD) => _$this._pathD = pathD;

  LayoutIrVectorDtoBuilder() {
    LayoutIrVectorDto._defaults(this);
  }

  LayoutIrVectorDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _kind = $v.kind;
      _x = $v.x;
      _y = $v.y;
      _width = $v.width;
      _height = $v.height;
      _strokeWidthPt = $v.strokeWidthPt;
      _filled = $v.filled;
      _fillGray = $v.fillGray;
      _fillRgb = $v.fillRgb?.toBuilder();
      _strokeRgb = $v.strokeRgb?.toBuilder();
      _pathD = $v.pathD;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutIrVectorDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$LayoutIrVectorDto;
  }

  @override
  void update(void Function(LayoutIrVectorDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LayoutIrVectorDto build() => _build();

  _$LayoutIrVectorDto _build() {
    _$LayoutIrVectorDto _$result;
    try {
      _$result = _$v ??
          new _$LayoutIrVectorDto._(
              kind: BuiltValueNullFieldError.checkNotNull(
                  kind, r'LayoutIrVectorDto', 'kind'),
              x: BuiltValueNullFieldError.checkNotNull(
                  x, r'LayoutIrVectorDto', 'x'),
              y: BuiltValueNullFieldError.checkNotNull(
                  y, r'LayoutIrVectorDto', 'y'),
              width: BuiltValueNullFieldError.checkNotNull(
                  width, r'LayoutIrVectorDto', 'width'),
              height: BuiltValueNullFieldError.checkNotNull(
                  height, r'LayoutIrVectorDto', 'height'),
              strokeWidthPt: strokeWidthPt,
              filled: filled,
              fillGray: fillGray,
              fillRgb: _fillRgb?.build(),
              strokeRgb: _strokeRgb?.build(),
              pathD: pathD);
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'fillRgb';
        _fillRgb?.build();
        _$failedField = 'strokeRgb';
        _strokeRgb?.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'LayoutIrVectorDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
