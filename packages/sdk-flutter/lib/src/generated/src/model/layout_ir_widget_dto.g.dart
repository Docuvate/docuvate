// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_ir_widget_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const LayoutIrWidgetDtoKindEnum _$layoutIrWidgetDtoKindEnum_text =
    const LayoutIrWidgetDtoKindEnum._('text');
const LayoutIrWidgetDtoKindEnum _$layoutIrWidgetDtoKindEnum_checkbox =
    const LayoutIrWidgetDtoKindEnum._('checkbox');

LayoutIrWidgetDtoKindEnum _$layoutIrWidgetDtoKindEnumValueOf(String name) {
  switch (name) {
    case 'text':
      return _$layoutIrWidgetDtoKindEnum_text;
    case 'checkbox':
      return _$layoutIrWidgetDtoKindEnum_checkbox;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<LayoutIrWidgetDtoKindEnum> _$layoutIrWidgetDtoKindEnumValues =
    BuiltSet<LayoutIrWidgetDtoKindEnum>(const <LayoutIrWidgetDtoKindEnum>[
  _$layoutIrWidgetDtoKindEnum_text,
  _$layoutIrWidgetDtoKindEnum_checkbox,
]);

Serializer<LayoutIrWidgetDtoKindEnum> _$layoutIrWidgetDtoKindEnumSerializer =
    _$LayoutIrWidgetDtoKindEnumSerializer();

class _$LayoutIrWidgetDtoKindEnumSerializer
    implements PrimitiveSerializer<LayoutIrWidgetDtoKindEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'text': 'text',
    'checkbox': 'checkbox',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'text': 'text',
    'checkbox': 'checkbox',
  };

  @override
  final Iterable<Type> types = const <Type>[LayoutIrWidgetDtoKindEnum];
  @override
  final String wireName = 'LayoutIrWidgetDtoKindEnum';

  @override
  Object serialize(Serializers serializers, LayoutIrWidgetDtoKindEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  LayoutIrWidgetDtoKindEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      LayoutIrWidgetDtoKindEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$LayoutIrWidgetDto extends LayoutIrWidgetDto {
  @override
  final LayoutIrWidgetDtoKindEnum kind;
  @override
  final num page;
  @override
  final num x;
  @override
  final num y;
  @override
  final num width;
  @override
  final num height;
  @override
  final String? value;
  @override
  final bool? checked;
  @override
  final String? fieldName;
  @override
  final num? rotationDeg;
  @override
  final num? fontSizePt;
  @override
  final String? fontFamily;
  @override
  final String? align;
  @override
  final String? checkMark;

  factory _$LayoutIrWidgetDto(
          [void Function(LayoutIrWidgetDtoBuilder)? updates]) =>
      (LayoutIrWidgetDtoBuilder()..update(updates))._build();

  _$LayoutIrWidgetDto._(
      {required this.kind,
      required this.page,
      required this.x,
      required this.y,
      required this.width,
      required this.height,
      this.value,
      this.checked,
      this.fieldName,
      this.rotationDeg,
      this.fontSizePt,
      this.fontFamily,
      this.align,
      this.checkMark})
      : super._();
  @override
  LayoutIrWidgetDto rebuild(void Function(LayoutIrWidgetDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutIrWidgetDtoBuilder toBuilder() =>
      LayoutIrWidgetDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutIrWidgetDto &&
        kind == other.kind &&
        page == other.page &&
        x == other.x &&
        y == other.y &&
        width == other.width &&
        height == other.height &&
        value == other.value &&
        checked == other.checked &&
        fieldName == other.fieldName &&
        rotationDeg == other.rotationDeg &&
        fontSizePt == other.fontSizePt &&
        fontFamily == other.fontFamily &&
        align == other.align &&
        checkMark == other.checkMark;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, kind.hashCode);
    _$hash = $jc(_$hash, page.hashCode);
    _$hash = $jc(_$hash, x.hashCode);
    _$hash = $jc(_$hash, y.hashCode);
    _$hash = $jc(_$hash, width.hashCode);
    _$hash = $jc(_$hash, height.hashCode);
    _$hash = $jc(_$hash, value.hashCode);
    _$hash = $jc(_$hash, checked.hashCode);
    _$hash = $jc(_$hash, fieldName.hashCode);
    _$hash = $jc(_$hash, rotationDeg.hashCode);
    _$hash = $jc(_$hash, fontSizePt.hashCode);
    _$hash = $jc(_$hash, fontFamily.hashCode);
    _$hash = $jc(_$hash, align.hashCode);
    _$hash = $jc(_$hash, checkMark.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutIrWidgetDto')
          ..add('kind', kind)
          ..add('page', page)
          ..add('x', x)
          ..add('y', y)
          ..add('width', width)
          ..add('height', height)
          ..add('value', value)
          ..add('checked', checked)
          ..add('fieldName', fieldName)
          ..add('rotationDeg', rotationDeg)
          ..add('fontSizePt', fontSizePt)
          ..add('fontFamily', fontFamily)
          ..add('align', align)
          ..add('checkMark', checkMark))
        .toString();
  }
}

class LayoutIrWidgetDtoBuilder
    implements Builder<LayoutIrWidgetDto, LayoutIrWidgetDtoBuilder> {
  _$LayoutIrWidgetDto? _$v;

  LayoutIrWidgetDtoKindEnum? _kind;
  LayoutIrWidgetDtoKindEnum? get kind => _$this._kind;
  set kind(LayoutIrWidgetDtoKindEnum? kind) => _$this._kind = kind;

  num? _page;
  num? get page => _$this._page;
  set page(num? page) => _$this._page = page;

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

  String? _value;
  String? get value => _$this._value;
  set value(String? value) => _$this._value = value;

  bool? _checked;
  bool? get checked => _$this._checked;
  set checked(bool? checked) => _$this._checked = checked;

  String? _fieldName;
  String? get fieldName => _$this._fieldName;
  set fieldName(String? fieldName) => _$this._fieldName = fieldName;

  num? _rotationDeg;
  num? get rotationDeg => _$this._rotationDeg;
  set rotationDeg(num? rotationDeg) => _$this._rotationDeg = rotationDeg;

  num? _fontSizePt;
  num? get fontSizePt => _$this._fontSizePt;
  set fontSizePt(num? fontSizePt) => _$this._fontSizePt = fontSizePt;

  String? _fontFamily;
  String? get fontFamily => _$this._fontFamily;
  set fontFamily(String? fontFamily) => _$this._fontFamily = fontFamily;

  String? _align;
  String? get align => _$this._align;
  set align(String? align) => _$this._align = align;

  String? _checkMark;
  String? get checkMark => _$this._checkMark;
  set checkMark(String? checkMark) => _$this._checkMark = checkMark;

  LayoutIrWidgetDtoBuilder() {
    LayoutIrWidgetDto._defaults(this);
  }

  LayoutIrWidgetDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _kind = $v.kind;
      _page = $v.page;
      _x = $v.x;
      _y = $v.y;
      _width = $v.width;
      _height = $v.height;
      _value = $v.value;
      _checked = $v.checked;
      _fieldName = $v.fieldName;
      _rotationDeg = $v.rotationDeg;
      _fontSizePt = $v.fontSizePt;
      _fontFamily = $v.fontFamily;
      _align = $v.align;
      _checkMark = $v.checkMark;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutIrWidgetDto other) {
    _$v = other as _$LayoutIrWidgetDto;
  }

  @override
  void update(void Function(LayoutIrWidgetDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LayoutIrWidgetDto build() => _build();

  _$LayoutIrWidgetDto _build() {
    final _$result = _$v ??
        _$LayoutIrWidgetDto._(
          kind: BuiltValueNullFieldError.checkNotNull(
              kind, r'LayoutIrWidgetDto', 'kind'),
          page: BuiltValueNullFieldError.checkNotNull(
              page, r'LayoutIrWidgetDto', 'page'),
          x: BuiltValueNullFieldError.checkNotNull(
              x, r'LayoutIrWidgetDto', 'x'),
          y: BuiltValueNullFieldError.checkNotNull(
              y, r'LayoutIrWidgetDto', 'y'),
          width: BuiltValueNullFieldError.checkNotNull(
              width, r'LayoutIrWidgetDto', 'width'),
          height: BuiltValueNullFieldError.checkNotNull(
              height, r'LayoutIrWidgetDto', 'height'),
          value: value,
          checked: checked,
          fieldName: fieldName,
          rotationDeg: rotationDeg,
          fontSizePt: fontSizePt,
          fontFamily: fontFamily,
          align: align,
          checkMark: checkMark,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
