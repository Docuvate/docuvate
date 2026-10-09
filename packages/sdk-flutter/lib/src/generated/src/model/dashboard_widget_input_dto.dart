//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'dashboard_widget_input_dto.g.dart';

/// DashboardWidgetInputDto
///
/// Properties:
/// * [id] 
/// * [type] 
/// * [position] 
/// * [widthCols] 
/// * [heightRows] 
/// * [savedViewId] 
/// * [itemLimit] 
@BuiltValue()
abstract class DashboardWidgetInputDto implements Built<DashboardWidgetInputDto, DashboardWidgetInputDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String? get id;

  @BuiltValueField(wireName: r'type')
  DashboardWidgetInputDtoTypeEnum get type;
  // enum typeEnum {  saved_view,  upload,  statistics,  recent_documents,  attention,  };

  @BuiltValueField(wireName: r'position')
  num get position;

  @BuiltValueField(wireName: r'widthCols')
  num get widthCols;

  @BuiltValueField(wireName: r'heightRows')
  num get heightRows;

  @BuiltValueField(wireName: r'savedViewId')
  String? get savedViewId;

  @BuiltValueField(wireName: r'itemLimit')
  num? get itemLimit;

  DashboardWidgetInputDto._();

  factory DashboardWidgetInputDto([void updates(DashboardWidgetInputDtoBuilder b)]) = _$DashboardWidgetInputDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DashboardWidgetInputDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DashboardWidgetInputDto> get serializer => _$DashboardWidgetInputDtoSerializer();
}

class _$DashboardWidgetInputDtoSerializer implements PrimitiveSerializer<DashboardWidgetInputDto> {
  @override
  final Iterable<Type> types = const [DashboardWidgetInputDto, _$DashboardWidgetInputDto];

  @override
  final String wireName = r'DashboardWidgetInputDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DashboardWidgetInputDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.id != null) {
      yield r'id';
      yield serializers.serialize(
        object.id,
        specifiedType: const FullType(String),
      );
    }
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(DashboardWidgetInputDtoTypeEnum),
    );
    yield r'position';
    yield serializers.serialize(
      object.position,
      specifiedType: const FullType(num),
    );
    yield r'widthCols';
    yield serializers.serialize(
      object.widthCols,
      specifiedType: const FullType(num),
    );
    yield r'heightRows';
    yield serializers.serialize(
      object.heightRows,
      specifiedType: const FullType(num),
    );
    if (object.savedViewId != null) {
      yield r'savedViewId';
      yield serializers.serialize(
        object.savedViewId,
        specifiedType: const FullType(String),
      );
    }
    if (object.itemLimit != null) {
      yield r'itemLimit';
      yield serializers.serialize(
        object.itemLimit,
        specifiedType: const FullType(num),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DashboardWidgetInputDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DashboardWidgetInputDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DashboardWidgetInputDtoTypeEnum),
          ) as DashboardWidgetInputDtoTypeEnum;
          result.type = valueDes;
          break;
        case r'position':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.position = valueDes;
          break;
        case r'widthCols':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.widthCols = valueDes;
          break;
        case r'heightRows':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.heightRows = valueDes;
          break;
        case r'savedViewId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.savedViewId = valueDes;
          break;
        case r'itemLimit':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.itemLimit = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DashboardWidgetInputDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DashboardWidgetInputDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

class DashboardWidgetInputDtoTypeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'saved_view')
  static const DashboardWidgetInputDtoTypeEnum savedView = _$dashboardWidgetInputDtoTypeEnum_savedView;
  @BuiltValueEnumConst(wireName: r'upload')
  static const DashboardWidgetInputDtoTypeEnum upload = _$dashboardWidgetInputDtoTypeEnum_upload;
  @BuiltValueEnumConst(wireName: r'statistics')
  static const DashboardWidgetInputDtoTypeEnum statistics = _$dashboardWidgetInputDtoTypeEnum_statistics;
  @BuiltValueEnumConst(wireName: r'recent_documents')
  static const DashboardWidgetInputDtoTypeEnum recentDocuments = _$dashboardWidgetInputDtoTypeEnum_recentDocuments;
  @BuiltValueEnumConst(wireName: r'attention')
  static const DashboardWidgetInputDtoTypeEnum attention = _$dashboardWidgetInputDtoTypeEnum_attention;

  static Serializer<DashboardWidgetInputDtoTypeEnum> get serializer => _$dashboardWidgetInputDtoTypeEnumSerializer;

  const DashboardWidgetInputDtoTypeEnum._(String name): super(name);

  static BuiltSet<DashboardWidgetInputDtoTypeEnum> get values => _$dashboardWidgetInputDtoTypeEnumValues;
  static DashboardWidgetInputDtoTypeEnum valueOf(String name) => _$dashboardWidgetInputDtoTypeEnumValueOf(name);
}

